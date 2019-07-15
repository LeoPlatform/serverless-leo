
const AWS = require('aws-sdk')
var dynamoClient = new AWS.DynamoDB.DocumentClient()

const getSetting = function (id) {
  var getSettingParams = {
    TableName: this.config.tables.settings,
    Key: {
      'id': id
    }
  }

  return dynamoClient.get(getSettingParams).promise().then(result => result.Item)
}

module.exports = getSetting
