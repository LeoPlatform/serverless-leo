'use strict';

const _ = require('lodash');

module.exports = {
    validate() {
        const streams = [];
        const stage = this.provider.getStage()
        const custom = this.serverless.service.custom[stage] ? this.serverless.service.custom[stage] : this.serverless.service.custom

        _.forEach(this.serverless.service.functions, (functionObject, functionName) => {
            if (functionObject.leo) {
                if (!functionObject.leo.source && !functionObject.leo.time && !functionObject.leo.system) {
                    throw new Error(`Leo streams require at least one type of source. EG source, time, system. Check your ${functionName} lambda function in the serverless yml`)
                }
                streams.push(functionObject.leo)
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
