'use strict'

const forEach = require('lodash/forEach')

module.exports = {
  validate () {
    const streams = []
    const errors = []
    const stage = this.provider.getStage()

    if (!this.serverless.service.custom) {
      errors.push(new Error(`serverless-leo requires "custom" section. Please verify your serverless.yml.`))
      return { streams, errors }
    }

    const custom = this.serverless.service.custom[stage] ? this.serverless.service.custom[stage] : this.serverless.service.custom
    if (!custom.leoStack && !custom.leoRegister) {
      errors.push(new Error(`Leo streams require the custom "leoStack" or "leoRegister" variable. Optionally under custom[stage]. Please verify your serverless.yml.`))
      return { streams, errors }
    }

    forEach(this.serverless.service.functions, functionObject => {
      if (functionObject.events) {
        forEach(functionObject.events, (functionEvent) => {
          if (typeof functionEvent.leo === 'object') {
            if (!functionEvent.leo.queue && !functionEvent.leo.cron && !functionEvent.leo.register) {
              errors.push(new Error('Error in serverless.yml ' + (functionEvent.leo.name || functionObject.name) + ' : Leo event requires queue, cron, or register.'))
              return false
            }
            if (functionEvent.leo.queue && functionEvent.leo.cron) {
              errors.push(new Error('Error in serverless.yml ' + (functionEvent.leo.name || functionObject.name) + ' : Leo event cannot have both queue and cron triggers.'))
            }
            streams.push(functionEvent.leo)
          } else if (typeof functionEvent.leo === 'string') {
            streams.push(functionEvent.leo)
          } else if (functionEvent.leo) {
            errors.push(new Error('Error in serverless.yml ' + (functionEvent.leo.name || functionObject.name) + ' : Leo events should be specified as a string, or as an object.'))
            return false
          }
        })
      }
      if (functionObject.leoCron) {
        streams.push(functionObject.leoCron)
      }
    })

    if (!streams.length) {
      return {
        streams,
        errors
      }
    }

    return {
      streams,
      errors
    }
  }
}
