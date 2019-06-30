const config = require('./leo-tools-config')

const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId) => {
	var removeCheckpointsParams = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #C.#R = :r, #C.#W = :w',
		ExpressionAttributeNames: { '#C': 'checkpoints', '#R': 'read', '#W': 'write' },
		ExpressionAttributeValues: { ':r': {}, ':w': {} }
	}

	return documentClient.update(removeCheckpointsParams).promise()
}
