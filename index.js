'use strict';

const BbPromise = require('bluebird');

const validate = require('./lib/validate');
const compileLeo = require('./lib/leo');

class AwsCompileLeo {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = this.serverless.getProvider('aws');

        Object.assign(
            this,
            validate,
            compileLeo
        );

        this.hooks = {
            'after:package:compileFunctions': () => {
                this.validated = this.validate();

                if (this.validated.streams.length === 0) {
                    return BbPromise.resolve();
                }

                return BbPromise.bind(this)
                    .then(this.compileLeo);
            },
        };
    }
}

module.exports = AwsCompileLeo;
