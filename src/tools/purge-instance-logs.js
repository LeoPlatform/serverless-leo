const config = require('./leo-tools-config')

const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (botId, instanceNumber) => {
	var purgeInstanceLogsParams = {
		TableName: config.tables.bot,
		Key: { id: botId },
		UpdateExpression: 'set #I.#X.#L = :l',
		ExpressionAttributeNames: { '#I': 'instances', '#X': instanceNumber.toString(), '#L': 'logs' },
		ExpressionAttributeValues: { ':l': {
			errors: [],
			notices: []
		} }
	}

	return documentClient.update(purgeInstanceLogsParams).promise()
}
