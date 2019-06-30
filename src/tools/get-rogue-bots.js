
const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = async function () {
  // bots where errorCount > 10
  // not archived
  // must have trigger (time or trigger)
  var botsContainingParams = {
    TableName: this.config.tables.bot,
    ScanFilter: {
      'errorCount': {
        ComparisonOperator: 'GT',
        AttributeValueList: [10]
      },
      'archived': {
        ComparisonOperator: 'NE',
        AttributeValueList: [true]
      }
    },
    Select: 'ALL_ATTRIBUTES'
  }

  const requireTrigger = ({ Items }) => {
    return Items.filter(i => ((i.triggers && i.triggers.length > 0) || (i.time)))
  }

  return documentClient.scan(botsContainingParams).promise().then(requireTrigger)
}
