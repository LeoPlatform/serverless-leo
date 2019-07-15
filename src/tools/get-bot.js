
const AWS = require('aws-sdk')
var dynamoClient = new AWS.DynamoDB.DocumentClient()

const getBot = function (id) {
  var getBotParams = {
    TableName: this.config.tables.bot,
    Key: {
      'id': id
    }
  }

  return dynamoClient.get(getBotParams).promise().then(result => result.Item)
}

module.exports = getBot
