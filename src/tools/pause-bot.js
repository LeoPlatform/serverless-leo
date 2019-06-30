
const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = function (botId, pauseState = true) {
  var setPauseParameters = {
    TableName: this.config.tables.bot,
    Key: { id: botId },
    UpdateExpression: 'set #P = :p',
    ExpressionAttributeNames: { '#P': 'paused' },
    ExpressionAttributeValues: { ':p': pauseState }
  }

  return documentClient.update(setPauseParameters).promise()
}
