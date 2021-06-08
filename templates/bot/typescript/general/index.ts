"use strict";

const {
  streams: { pipe, read, load },
} = require("leo-sdk");

exports.handler = function (event, context, callback) {
  const ID = context.botId;
  let settings = Object.assign({}, event);

  // Do work
  callback();
};
