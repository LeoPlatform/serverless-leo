const config = require('./leo-tools-config')
const AWS = require('aws-sdk')
var dynamoClient = new AWS.DynamoDB.DocumentClient()

const getSetting = (id) => {
	var getSettingParams = {
		TableName: config.tables.settings,
		Key: {
			'id': id
		}
	}

	return dynamoClient.get(getSettingParams).promise().then(result => result.Item)
}

module.exports = getSetting
