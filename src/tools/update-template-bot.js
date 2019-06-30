const config = require('./leo-tools-config')
const AWS = require('aws-sdk')

var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId, templateName) => {
	// for the given botId, set the templateId = templateName
	var templateIdValue = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #T = :t',
		ExpressionAttributeNames: { '#T': 'templateId' },
		ExpressionAttributeValues: { ':t': templateName }
	}

	return documentClient.update(templateIdValue).promise()
}
