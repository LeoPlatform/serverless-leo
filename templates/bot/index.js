"use strict";
const { streams: { pipe, read, load }} = require("leo-sdk");

// TODO: use serverless.<botname>.yml for the part of the yaml.. so that it is not confused as a "base" serverless.yml microservice

exports.handler = function(event, context, callback) {
	const ID = context.botId;
	let settings = Object.assign({}, event);

	// Do work
	callback();
};
