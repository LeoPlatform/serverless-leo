const config = require('./leo-tools-config')
const AWS = require('aws-sdk')

var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = async (variationBaseName) => {
	// Anything that begins with variationBaseName
	var getVariationsWithBaseName = {
		TableName: config.tables.bot,
		ScanFilter: {
			'id': {
				ComparisonOperator: 'BEGINS_WITH',
				AttributeValueList: [variationBaseName]
			},
			'archived': {
				ComparisonOperator: 'NE',
				AttributeValueList: [true]
			}
		},
		Select: 'ALL_ATTRIBUTES'
	}

	const variations = await documentClient.scan(getVariationsWithBaseName).promise()

	return variations.Items
}
