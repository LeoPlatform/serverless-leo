
const AWS = require('aws-sdk')
var dynamoClient = new AWS.DynamoDB.DocumentClient()

module.exports = async function (queue, startKey = '', limit = 10) {
  function hashCode (str) {
    if (typeof str === 'number') {
      return str
    } else if (Array.isArray(str)) {
      let h = 0
      for (let a = 0; a < str.length; a++) {
        h += hashCode(str[a])
      }
      return h
    }
    let hash = 0
    let i; let chr
    if (str.length === 0) return hash
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0 // Convert to 32bit integer
    }
    return hash
  }

  let id = '1598-15881194'
  let partitionNum = (hashCode(id) % 10)

  var queryParams = {
    TableName: this.config.tables.entities,
    KeyConditionExpression: '#partition = :partition and #id = :id',
    ExpressionAttributeNames: {
      '#partition': 'partition',
      '#id': 'id'
    },
    ExpressionAttributeValues: {
      ':partition': `${queue}-${partitionNum}`,
      ':id': id
    },
    Limit: limit
  }

  // let prefix = '15077-16214347'
  let prefix = '15077-1'
  var scanParams = {
    TableName: this.config.tables.entities,
    ScanFilter: {
      'id': {
        ComparisonOperator: 'BEGINS_WITH',
        AttributeValueList: [prefix]
      }
    },
    Select: 'ALL_ATTRIBUTES'
  }

  if (startKey) {
    scanParams = Object.assign(
      scanParams,
      { 'ExclusiveStartKey': startKey }
    )
  }

  /*
	get: function(table, entity, id) {
		if (id === undefined) {
			id = entity;
			entity = "";
		} else {
			entity += "-";
		}

		return leo.aws.dynamodb.query({
			TableName: table,
			KeyConditionExpression: `#partition = :partition and #id = :id`,
			ExpressionAttributeNames: {
				"#partition": "partition",
				"#id": "id"
			},
			ExpressionAttributeValues: {
				":partition": entity + (hashCode(id) % 10),
				":id": id
			},
			Limit: 1
		}).then(data => (data.Items[0] && data.Items[0].data));
	}
	*/

  // console.log(queryParams)
  // return dynamoClient.query(queryParams).promise()

  // console.log(scanParams)
  return dynamoClient.scan(scanParams).promise()
}
