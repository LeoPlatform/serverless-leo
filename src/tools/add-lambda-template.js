const config = require('./leo-tools-config')
const AWS = require('aws-sdk')

var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = (lambdaName, templateName) => {
	// in the Leo Settings table lambda-templates entry. Add lambdaname: templateName to the map
	var addLambdaTemplate = {
		TableName: config.tables.settings,
		Key: { id: 'lambda_templates' },
		UpdateExpression: 'set #V.#L = :l',
		ExpressionAttributeNames: {
			'#V': 'value',
			'#L': lambdaName
		},
		ExpressionAttributeValues: { ':l': templateName }
	}
	return documentClient.update(addLambdaTemplate).promise()
}
