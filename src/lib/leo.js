'use strict';

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
    compileLeo() {
        const allFunctions = this.serverless.service.getAllFunctions();
        const stage = this.serverless.service.custom.stage;
        const custom = this.serverless.service.custom[stage] ? this.serverless.service.custom[stage] : this.serverless.service.custom
        const cloudformation = this.serverless.service.provider.compiledCloudFormationTemplate
        const customInstall = {
            Type: "Custom::Install",
            Properties: {}
        }
        if (custom.leoRegister) {
            customInstall.Properties.ServiceToken = custom.leoRegister
        } else {
            customInstall.Properties.ServiceToken = {
                "Fn::ImportValue": {
                    "Fn::Sub": `${custom.leoStack}-Register`
                }
            }
        }
        const registrations = []
        const botIds = []

        function addInstallProperty (logicalId, installProperty) {
            if (botIds.includes(installProperty.id)) {
                throw new Error(`Bot IDs must be unique. ${installProperty.id} has already been added to the cloudformation.`)
            }
            botIds.push(installProperty.id)
            if (registrations.length === 0) {
                registrations.push(_.cloneDeep(customInstall))
            }
            let currentRegister = registrations[registrations.length - 1]
            if (Object.keys(currentRegister.Properties).length > 100) {
                currentRegister = _.cloneDeep(customInstall)
                registrations.push(currentRegister)
            }
            currentRegister.Properties[logicalId] = installProperty
        }

        return BbPromise.each(
            allFunctions,
            ymlFunctionName => {
                const functionObj = this.serverless.service.getFunction(ymlFunctionName)
                const leoEvents = functionObj.events ? functionObj.events.filter(event => event.leo) : []
                const logicalId = this.provider.naming.getLambdaLogicalId(ymlFunctionName)
                const botNumbers = _.times(functionObj.botCount || 1, Number)

                botNumbers.forEach(botNumber => {
                    const botSuffix = botNumber > 0 ? '_' + botNumber : ''
                    let botId = functionObj.name + botSuffix
                    const installProperty = {
                        type: "cron",
                        settings: {},
                        lambdaName: {
                            Ref: logicalId
                        },
                        name: botId.replace(`${this.serverless.service.service}-${stage}-`, '')
                    }

                    if (functionObj.leoCron) {
                        installProperty.time = functionObj.leoCron
                    }

                    if (functionObj.leoCron && leoEvents.length === 0) {
                        installProperty.id = `${botId}`
                        addInstallProperty(botId, installProperty)
                    }
                    if (leoEvents.length > 0) {
                        leoEvents.forEach(leoEvent => {
                            const config = leoEvent.leo instanceof Object ? leoEvent.leo : false
                            const sourceQueue = config ? config.queue : leoEvent.leo
                            botId = functionObj.name + '_' + sourceQueue + botSuffix
                            const installEventProperty = _.cloneDeep(installProperty)
                            installEventProperty.id = `${botId}`
                            if (config && config.name) {
                                installEventProperty.name = config.name
                            } else {
                                installEventProperty.name = botId.replace(`${this.serverless.service.service}-${stage}-`, '')
                            }
                            installEventProperty.settings.source = sourceQueue
                            addInstallProperty(botId, installEventProperty)
                        })
                    }
                })
            }
        ).then(() => {
            registrations.forEach((leoRegister, index) => {
                cloudformation.Resources[`LeoRegister${index}`] = leoRegister
            })
        });
    }
};
