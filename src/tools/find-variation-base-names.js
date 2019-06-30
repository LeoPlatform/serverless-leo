
const AWS = require('aws-sdk')
var documentClient = new AWS.DynamoDB.DocumentClient()

module.exports = async function () {
  // Anything with '-var' in the name is a variation
  var getAllVariations = {
    TableName: this.config.tables.bot,
    ScanFilter: {
      'id': {
        ComparisonOperator: 'CONTAINS',
        AttributeValueList: ['-var-']
      },
      'archived': {
        ComparisonOperator: 'NE',
        AttributeValueList: [true]
      }
    },
    Select: 'ALL_ATTRIBUTES'
  }

  const variations = await documentClient.scan(getAllVariations).promise()

  const baseNames = variations.Items.reduce((accumulator, current) => {
    const baseName = current.id.substring(0, current.id.indexOf('-var-'))
    if (!(baseName in accumulator)) {
      accumulator[baseName] = baseName
    }
    return accumulator
  }, {})

  return Object.keys(baseNames)
}
