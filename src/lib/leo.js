'use strict'

const cloneDeep = require('lodash/cloneDeep')
const times = require('lodash/times')
const BbPromise = require('bluebird')

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

    function addInstallProperty (botId, installProperty) {
      if (botIds.includes(botId)) {
        throw new Error(`Bot IDs must be unique. ${botId} has already been added to the cloudformation.`)
      }
      installProperty.id = botId
      botIds.push(botId)
      if (registrations.length === 0) {
        registrations.push(cloneDeep(customInstall))
      }
      let currentRegister = registrations[registrations.length - 1]
      if (Object.keys(currentRegister.Properties).length > 100) {
        currentRegister = cloneDeep(customInstall)
        registrations.push(currentRegister)
      }
      currentRegister.Properties[botId] = installProperty
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
            const prefix = config && config.prefix ? `${config.prefix}` : undefined
            const botPrefix = prefix ? `${prefix}-` : ''
            const sourceQueue = config ? config.queue : leoEvent.leo
            const botNumbers = times((config && config.botCount) || 1, Number)
            botNumbers.forEach(botNumber => {
              let botId
              let botSuffix = botNumber > 0 ? '-' + botNumber : ''
              // If there is no botPrefix, no source queue and multiple bots: add the eventIndex to the botSuffix (botId ultimately)
              if (!botPrefix && !sourceQueue && leoEvents.length > 1) {
                botSuffix = `-${eventIndex}${botSuffix}`
              }
              // Only add the queue to the bot name if there are multiple events
              if (sourceQueue && leoEvents.length > 1) {
                botId = `${this.serverless.service.service}-${stage}-${botPrefix}${sourceQueue}-${ymlFunctionName}${botSuffix}`
              } else {
                botId = `${this.serverless.service.service}-${stage}-${botPrefix}${ymlFunctionName}${botSuffix}`
              }
              const installProperty = {
                type: 'cron',
                settings: {
                  botNumber,
                  prefix
                },
                lambdaName: {
                  Ref: logicalId
                }
              }
              if (sourceQueue) {
                installProperty.settings.source = sourceQueue
                installProperty.settings.queue = sourceQueue
              }
              if (config && config.cron) {
                installProperty.time = config.cron
              }
              if (config && config.name) {
                installProperty.name = config.name
              } else {
                installProperty.name = botId.replace(`${this.serverless.service.service}-${stage}-`, '')
              }
              if (config && config.codeOverrides) {
                installProperty.settings.codeOverrides = config.codeOverrides
              }
              if (sourceQueue || (config && (config.cron || config.register))) {
                addInstallProperty(botId, installProperty)
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
