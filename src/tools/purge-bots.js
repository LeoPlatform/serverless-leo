// 
// const AWS = require('aws-sdk')
// var dynamodb = new AWS.DynamoDB()

function purgeBots (bots) {
	// remove stats table
	// remove from bots table
}

/*
	{
		executionType: { S: 'lambda' },
		lambdaName: { S: 'warehouse-domain-DwDomainLeaseChanges-1OOCLWYOKE99M' },
		trigger: { N: '1532970066299' },
		triggers: { L: [Array] },
		message: { NULL: true },
		invokeTime: { N: '1529776868556' },
		requested_kinesis: { M: [Object] },
		lambda: { M: [Object] },
		archived: { BOOL: true },
		errorCount: { N: '3' },
		instances: { M: [Object] },
		id: { S: 'dw-domain-lease-changes' },
		paused: { BOOL: true },
		checkpoints: { M: [Object] }
	}
*/

module.exports = purgeBots
