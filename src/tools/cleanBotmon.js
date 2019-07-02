const AWS = require('aws-sdk')
var dynamodb = new AWS.DynamoDB({ region: 'us-west-2' })

var queryParams = {
	TableName: 'dev-bus-LeoCron-7GL7C0C2IKSA',
	FilterExpression: 'contains(id, :a)',
	ExpressionAttributeValues: {
		':a': {
			S: '_dev'
		}
	}
}

dynamodb.scan(queryParams, function (err, data) {
	if (err) return console.log('QRY', err, err.stack) // an error occurred
	//	else console.log(data.Items.map(i => i.id)) // successful response
	data.Items.forEach(i => {
		const delParams = {
			TableName: 'dev-bus-LeoCron-7GL7C0C2IKSA',
			Key: {
				'id': i.id
			}
		}
		dynamodb.deleteItem(delParams, (err, data) => {
			if (err) {
				console.log('DEL', err)
				process.exit()
			}
			console.log(data)
		})
	})

	// remove from cron
	// remove fom stats bot:dw-domain-ar-transaction-var-entrata44_leo_ro_dev
})
