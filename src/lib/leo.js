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
            "Type": "Custom::Install",
            "Properties": {}
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
        registrations.push(_.cloneDeep(customInstall))
        return BbPromise.each(
            allFunctions,
            functionName => {
                const functionObj = this.serverless.service.getFunction(functionName)
                const stream = functionObj.leo
                const logicalId = this.provider.naming.getLambdaLogicalId(functionName)
                if (stream) {
                    const installProperty = {
                        "id": {
                            "Fn::Sub": logicalId
                        },
                        "type": "cron",
                        "settings": {},
                        "lambdaName": {
                            "Ref": logicalId
                        }
                    }

                    if (stream.source) {
                        installProperty.settings.source = stream.source
                    }

                    let currentRegister = registrations[registrations.length - 1]
                    if (Object.keys(currentRegister.Properties).length > 100) {
                        currentRegister = _.cloneDeep(customInstall)
                        registrations.push(currentRegister)
                    }
                    currentRegister.Properties[logicalId] = installProperty
                }
            }
        ).then(() => {
            registrations.forEach((leoRegister, index) => {
                cloudformation.Resources[`LeoRegister-${index}`] = leoRegister
            })
        });
    }
};
