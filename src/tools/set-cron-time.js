
const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = function (botId, cronTime) {
  var setCronTimeParams = {
    TableName: this.config.tables.bot,
    Key: { id: botId },
    UpdateExpression: 'set #T = :t',
    ExpressionAttributeNames: { '#T': 'time' },
    ExpressionAttributeValues: { ':t': cronTime }
  }

  // console.log(setCronTimeParams)
  return documentClient.update(setCronTimeParams).promise()
}
