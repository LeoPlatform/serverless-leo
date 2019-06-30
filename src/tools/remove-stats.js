const config = require('./leo-tools-config')
const chunk = require('lodash/fp/chunk')
const async = require('async')
const AWS = require('aws-sdk')
var dynamoClient = new AWS.DynamoDB.DocumentClient()

function removeStatsForBot (botId, done) {
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

		let count = 1
		// batch write can only do 25 at a time
		async.series(chunk(25, result.Items).map(chunkOfStats => {
			return (callback) => {
				const deleteRequests = chunkOfStats.map(i => {
					return {
						DeleteRequest: {
							Key: {
								'id': `bot:${botId}`,
								'bucket': i.bucket
							}
						}
					}
				})

				var params = {
					RequestItems: {
						[config.tables.stats]: deleteRequests
					},
					ReturnConsumedCapacity: 'NONE',
					ReturnItemCollectionMetrics: 'NONE'
				}
				console.log('Call to delete chunk of stats', count++)
				dynamoClient.batchWrite(params, (err, results) => {
					console.log('Results from delete chunk of stats call', results)
					// give it a little throttle to not overwhelm the dynamo database
					setTimeout(() => callback(err, results), 500)
				})
			}
		}), (err, result) => {
			console.log('DONE. NOTE: Run again if you suspect it has been paginated')
			done(err)
		})
	})
}

module.exports = removeStatsForBot
