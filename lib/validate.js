'use strict';

const _ = require('lodash');

module.exports = {
    validate() {
        const streams = [];
        const stage = this.provider.getStage()

        _.forEach(this.serverless.service.functions, (functionObject, functionName) => {
            if (functionObject.leo) {
                if (!functionObject.leo.source && !functionObject.leo.time && !functionObject.leo.system) {
                    throw new Error(`Leo streams require at least one type of source. EG source, time, system. Check your ${functionName} lambda function in the serverless yml`)
                }
                streams.push(functionObject.leo)
            }
        })

        if (streams.length && (!this.serverless.service.custom || (!this.serverless.service.custom.leoStack && !this.serverless.service.custom[stage].leoStack))) {
            throw new Error(`Leo streams require the custom "leoStack" variable in the serverless yml. Optionally under custom[stage]`)
        }

        return {
            streams,
        };
    },
};
