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

		function addInstallProperty (logicalId, installProperty) {
		if (botIds.includes(installProperty.id)) {
			throw new Error(`Bot IDs must be unique. ${installProperty.id} has already been added to the cloudformation.`)
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
		currentRegister.Properties[logicalId] = installProperty
		}

		return BbPromise.each(
			allFunctions,
			ymlFunctionName => {
				const functionObj = this.serverless.service.getFunction(ymlFunctionName)
				const leoEvents = functionObj.events ? functionObj.events.filter(event => event.leo) : []
				const logicalId = this.provider.naming.getLambdaLogicalId(ymlFunctionName)

				if (leoEvents.length > 0) {
					leoEvents.forEach(leoEvent => {
						const config = leoEvent.leo instanceof Object ? leoEvent.leo : false
						const sourceQueue = config ? config.queue : leoEvent.leo
						const botNumbers = times((config && config.botCount) || 1, Number)
						botNumbers.forEach(botNumber => {
							const botSuffix = botNumber > 0 ? '_' + botNumber : ''
							let botId = `${this.serverless.service.service}-${stage}-${ymlFunctionName}${botSuffix}`
							const installProperty = {
								id: botId,
								type: 'cron',
								settings: {
									botNumber
								},
								lambdaName: {
									Ref: logicalId
								}
							}
							if (config && config.cron) {
								installProperty.time = config.cron
							}
							if (sourceQueue) {
								botId = `${this.serverless.service.service}-${stage}-${ymlFunctionName}_${sourceQueue}${botSuffix}`
								installProperty.id = botId
								installProperty.settings.source = sourceQueue
							}
							if (config && config.name) {
								installProperty.name = config.name + botSuffix
							} else {
								installProperty.name = functionObj.botName ? functionObj.botName + botSuffix : botId.replace(`${this.serverless.service.service}-${stage}-`, '')
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
