
const AWS = require('aws-sdk')

var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = function (botId, templateName) {
  // for the given botId, set the templateId = templateName
  var templateIdValue = {
    TableName: this.config.tables.bot,
    Key: { id: botId },
    UpdateExpression: 'set #T = :t',
    ExpressionAttributeNames: { '#T': 'templateId' },
    ExpressionAttributeValues: { ':t': templateName }
  }

  return documentClient.update(templateIdValue).promise()
}
