
const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = function (botId, readCheckpointKey, newCheckpointEid) {
  if (typeof readCheckpointKey === 'undefined' || readCheckpointKey.length === 0) return Promise.resolve()
  var setCheckpointsParams = {
    TableName: this.config.tables.bot,
    Key: { id: botId },
    UpdateExpression: 'set #C.#R.#K.#CP = :cp',
    ExpressionAttributeNames: { '#C': 'checkpoints', '#R': 'read', '#K': readCheckpointKey, '#CP': 'checkpoint' },
    ExpressionAttributeValues: { ':cp': newCheckpointEid }
  }

  // console.log(setCheckpointsParams)
  return documentClient.update(setCheckpointsParams).promise()
}
