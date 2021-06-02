'use strict'

const cloneDeep = require('lodash/cloneDeep')
const times = require('lodash/times')
const BbPromise = require('bluebird')
const { getBotInfo } = require('./utils')

module.exports = {
  compileLeo () {
    const allFunctions = this.serverless.service.getAllFunctions()
    const stage = this.serverless.service.provider.stage
    const custom = this.serverless.service.custom[stage] ? this.serverless.service.custom[stage] : this.serverless.service.custom
    const cloudformation = this.serverless.service.provider.compiledCloudFormationTemplate
    const customInstall = {
      Type: 'Custom::Install',
      Properties: {}
    }

    if (custom.leoRegister) {
      customInstall.Properties.ServiceToken = custom.leoRegister
    } else {
      customInstall.Properties.ServiceToken = {
        'Fn::ImportValue': {
          'Fn::Sub': `${custom.leoStack}-Register`
        }
      }
    }

    const registrations = []
    const botIds = []

    function addInstallProperty (installProperty) {
      if (botIds.includes(installProperty.id)) {
        throw new Error(`Bot Ids must be unique. ${installProperty.id} has already been added to the cloudformation.`)
      }
      botIds.push(installProperty.id)
      if (registrations.length === 0) {
        registrations.push(cloneDeep(customInstall))
      }
      let currentRegister = registrations[registrations.length - 1]
      if (Object.keys(currentRegister.Properties).length > 100) {
        currentRegister = cloneDeep(customInstall)
        registrations.push(currentRegister)
      }
      currentRegister.Properties[installProperty.id] = installProperty
    }

    return BbPromise.each(
      allFunctions,
      ymlFunctionName => {
        const functionObj = this.serverless.service.getFunction(ymlFunctionName)
        const leoEvents = functionObj.events ? functionObj.events.filter(event => event.leo) : []
        const logicalId = this.provider.naming.getLambdaLogicalId(ymlFunctionName)

        if (leoEvents.length > 0) {
          leoEvents.forEach((leoEvent, eventIndex) => {
            const config = leoEvent.leo instanceof Object ? leoEvent.leo : false
            const botNumbers = times((config && config.botCount) || 1, Number)
            botNumbers.forEach(botNumber => {
              const {
                id,
                cron,
                name,
                prefix,
                queue,
                destination,
                register,
                suffix
              } = getBotInfo(this.serverless.service.service, stage, ymlFunctionName, leoEvents, eventIndex, config, botNumber)

              const installProperty = {
                id,
                name,
                time: cron,
                type: 'cron',
                settings: {
                  botNumber,
                  botCount: config.botCount,
                  codeOverrides: config && config.codeOverrides,
                  prefix,
                  queue,
                  source: queue,
                  destination,
                  suffix
                },
                lambdaName: {
                  Ref: logicalId
                }
              }
              if (queue || cron || register) {
                addInstallProperty(installProperty)
              }
            })
          })
        }
      }).then(() => {
      registrations.forEach((leoRegister, index) => {
        cloudformation.Resources[`LeoRegister${index}`] = leoRegister
      })
    })
  }
}
