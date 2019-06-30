const config = require('./leo-tools-config')

const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId) => {
	var forceRunBotParams = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #T = :t, #I = :i, #E = :e',
		ExpressionAttributeNames: { '#T': 'trigger', '#I': 'ignorePaused', '#E': 'errorCount' },
		ExpressionAttributeValues: { ':t': Date.now(), ':i': true, ':e': 0 }
	}

	return documentClient.update(forceRunBotParams).promise()
}
