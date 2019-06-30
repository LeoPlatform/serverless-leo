
const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = function (botId) {
  var removeTriggersParams = {
    TableName: this.config.tables.bot,
    Key: { id: botId },
    UpdateExpression: 'set #T = :t',
    ExpressionAttributeNames: { '#T': 'triggers' },
    ExpressionAttributeValues: { ':t': [] }
  }

  // console.log(removeTriggersParams)
  return documentClient.update(removeTriggersParams).promise()
}
