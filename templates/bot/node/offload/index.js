"use strict";

require("leo-config").bootstrap(require("../../leo_config"));
const leo = require("leo-sdk");

const lambdaHandler = async function (settings) {
  return new Promise((resolve, reject) => {
    leo.offload(
      {
        id: settings.botId,
        queue: settings.queue,
        each: function (payload, event, done) {
          leoHandler(payload, event).then(done.bind(null, null)).catch(done);
        },
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

async function leoHandler(payload) {
  console.log(`Received Payload\n\t${JSON.stringify(payload, null, 2)}`);
  console.log("Mocking Async Action");
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
}

exports.handler = require("leo-sdk/wrappers/cron")(lambdaHandler);
exports._handler = lambdaHandler; // for running locally
