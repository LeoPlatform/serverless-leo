const config = require('./leo-tools-config')
const AWS = require('aws-sdk')
var dynamoClient = new AWS.DynamoDB.DocumentClient()

const getBot = (id) => {
	var getBotParams = {
		TableName: config.tables.bot,
		Key: {
			'id': id
		}
	}

	return dynamoClient.get(getBotParams).promise().then(result => result.Item)
}

module.exports = getBot
