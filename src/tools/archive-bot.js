const config = require('./leo-tools-config')

const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId) => {
	var archiveBotParams = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #A = :a',
		ExpressionAttributeNames: { '#A': 'archived' },
		ExpressionAttributeValues: { ':a': true }
	}

	return documentClient.update(archiveBotParams).promise()
}
