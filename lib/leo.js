'use strict';

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
    compileLeo() {
        const allFunctions = this.serverless.service.getAllFunctions();
        const stage = this.serverless.service.custom.stage;
        const cloudformation = this.serverless.service.provider.compiledCloudFormationTemplate
        const customInstall = {
            "Type": "Custom::Install",
            "Properties": {
                "ServiceToken": {
                    "Fn::ImportValue": {
                        "Fn::Sub": `${this.serverless.service.custom[stage].leoStack || this.serverless.service.custom.leoStack}-Register`
                    }
                },
            }
        }
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

                    customInstall.Properties[logicalId] = installProperty
                }
            }
        ).then(() => {
            cloudformation.Resources.LeoRegister = customInstall
        });
    }
};
