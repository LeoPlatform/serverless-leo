"use strict";

const leoConfig = require("leo-config")
leoConfig.bootstrap(require("../../leo_config"));
const leo = require("leo-sdk");

export async function handler(event) {
  const stream = leo.load("NAME_TOKEN", "DESTINATION_TOKEN");
  return new Promise((resolve, reject) => {
    const { index, number } = event;
    stream.write({
      now: Date.now(),
      index,
      number,
    });
    stream.end((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
}