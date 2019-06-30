const config = require('./leo-tools-config')
const AWS = require('aws-sdk')
var dynamoClient = new AWS.DynamoDB.DocumentClient()

function getStatsForBot (botId, done) {
	var getStatsParams = {
		TableName: config.tables.stats,
		KeyConditionExpression: '#id = :botId',
		ExpressionAttributeNames: {
			'#id': 'id'
		},
		ExpressionAttributeValues: {
			':botId': `bot:${botId}`
		}
	}

	dynamoClient.query(getStatsParams, function (err, result) {
		if (err) {
			console.log(`Error querying stats for ${botId}`, err, err.stack)
			return done(err, [])
		}
		done(null, result.Items)
	})
}

module.exports = getStatsForBot
