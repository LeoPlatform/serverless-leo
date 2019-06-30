const config = require('./leo-tools-config')

const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId, cronTime) => {
	var setCronTimeParams = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #T = :t',
		ExpressionAttributeNames: { '#T': 'time' },
		ExpressionAttributeValues: { ':t': cronTime }
	}

	// console.log(setCronTimeParams)
	return documentClient.update(setCronTimeParams).promise()
}
