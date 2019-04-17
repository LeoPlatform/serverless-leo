'use strict';

const _ = require('lodash');

module.exports = {
    validate() {
        const streams = [];
        const stage = this.provider.getStage()
        const custom = this.serverless.service.custom[stage] ? this.serverless.service.custom[stage] : this.serverless.service.custom

        _.forEach(this.serverless.service.functions, functionObject => {
            if (functionObject.events) {
                _.forEach(functionObject.events, (functionEvent, functionName) => {
                    if (typeof functionEvent.leo === 'object') {
                        if (!functionEvent.leo.queue) {
                            throw new Error('Error in serverless.yml ' + functionName + ' : Queue is required when specifying the leo event as an object.')
                        }
                        streams.push(functionEvent.leo)
                    } else if (typeof functionEvent.leo === 'string') {
                        streams.push(functionEvent.leo)
                    } else {
                        throw new Error('Error in serverless.yml ' + functionName + ' : Leo events should be specified as a string, or as an object.')
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
            }
        }

        if (!this.serverless.service.custom) {
            throw new Error(`Leo streams require custom variables. Please verify your serverless.yml.`)
        }


        if (!custom.leoStack && !custom.leoRegister) {
            throw new Error(`Leo streams require the custom "leoStack" or "leoRegister" variable. Optionally under custom[stage]. Please verify your serverless.yml.`)
        }

        return {
            streams,
        };
    },
};
