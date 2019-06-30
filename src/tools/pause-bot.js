const config = require('./leo-tools-config')

const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId, pauseState = true) => {
	var setPauseParameters = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #P = :p',
		ExpressionAttributeNames: { '#P': 'paused' },
		ExpressionAttributeValues: { ':p': pauseState }
	}

	return documentClient.update(setPauseParameters).promise()
}
