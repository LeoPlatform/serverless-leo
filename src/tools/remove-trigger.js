const config = require('./leo-tools-config')

const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId) => {
	var removeTriggersParams = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #T = :t',
		ExpressionAttributeNames: { '#T': 'triggers' },
		ExpressionAttributeValues: { ':t': [] }
	}

	// console.log(removeTriggersParams)
	return documentClient.update(removeTriggersParams).promise()
}
