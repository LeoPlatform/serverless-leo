let child
const DynamoDbLocal = require('dynamodb-local')
const dynamoLocalPort = 8000
const AWS = require('aws-sdk')
// SET GLOBAL CONFIG
AWS.config.dynamodb = { endpoint: 'http://localhost:8000' }

const Tools = require('../')
const { assert, expect } = require('chai')
const setupDynamoDBLocal = require('./setup-dynamo-db-local')
const testConfig = setupDynamoDBLocal.config

describe('leo-tools', () => {
  before(async function () {
    this.timeout(30000)
    // in memory dynamo so no need to tear down
    child = await DynamoDbLocal.launch(dynamoLocalPort, null, ['-inMemory'], false, true) // must be wrapped in async function
    await setupDynamoDBLocal()
  })

  after(async function () {
    await DynamoDbLocal.stopChild(child) // must be wrapped in async function
  })

  it('can find all bots', async () => {
    const leoTools = new Tools(testConfig)
    const bots = await leoTools.getBotsContaining()
    console.log(bots)
  })

  it('can find variation base names', () => {
    const leoTools = new Tools(testConfig)
    return leoTools.findVariationBaseNames().then(baseNames => {
      // console.log('TEST RESULTS', baseNames)
      assert.isArray(baseNames)
      assert.isNotEmpty(baseNames)
    })
  }).timeout(5000)
  it('can get variations from base name', () => {
    const leoTools = new Tools(testConfig)
    return leoTools.getVariations('test-one').then(variations => {
      assert.isTrue(variations.length > 0)
      variations.forEach(v =>
        assert.equal(v.id.indexOf('test-one'), 0)
      )
    })
  }).timeout(5000)
  it('can update bot template name for given bot', async () => {
    const leoTools = new Tools(testConfig)
    await leoTools.updateBotTemplateName('test-bot-id', 'test-template-name')
    const bot = await leoTools.getBot('test-bot-id')
    assert.isDefined(bot)
  }).timeout(5000)
  it('can add a lambdaTemplate', async () => {
    const leoTools = new Tools(testConfig)
    await leoTools.addLambdaTemplate('test-lambda-id', 'test-lambda-template')
    const lambdaTemplateSetting = await leoTools.getSetting('lambda_templates')
    assert.isDefined(lambdaTemplateSetting)
    assert.isDefined(lambdaTemplateSetting.value['test-lambda-id'])
  }).timeout(5000)
  it('can force run a bot', async () => {
    const leoTools = new Tools(testConfig)
    await leoTools.forceRunBot('test-bot-id')
    const forcedBot = await leoTools.getBot('test-bot-id')
    assert.isDefined(forcedBot)
    assert.equal(forcedBot.errorCount, 0)
    assert.equal(forcedBot.ignorePaused, true)
    assert.isDefined(forcedBot.trigger)
  }).timeout(5000)
  it('can find rogue bots', async () => {
    const leoTools = new Tools(testConfig)
    const roqueBots = await leoTools.getRoqueBots()
    assert.isArray(roqueBots)
  }).timeout(5000)
  it('can remove triggers', async () => {
    const leoTools = new Tools(testConfig)
    const bot = await leoTools.getBot('test-remove-trigger-bot-id')
    assert.isArray(bot.triggers)
    assert.equal(bot.triggers.length, 1)
    await leoTools.removeTrigger('test-remove-trigger-bot-id')
    const newBot = await leoTools.getBot('test-remove-trigger-bot-id')
    assert.isArray(newBot.triggers)
    assert.equal(newBot.triggers.length, 0)
  }).timeout(5000)
  it('can clear checkpoints', async () => {
    const leoTools = new Tools(testConfig)
    const bot = await leoTools.getBot('test-remove-checkpoints-bot-id')
    assert.isNotEmpty(bot.checkpoints.read)
    assert.isNotEmpty(bot.checkpoints.write)
    await leoTools.removeCheckpoints('test-remove-checkpoints-bot-id')
    const newBot = await leoTools.getBot('test-remove-checkpoints-bot-id')
    assert.isEmpty(newBot.checkpoints.read)
    assert.isEmpty(newBot.checkpoints.write)
  }).timeout(5000)
  it('can archive a bot', async () => {
    const leoTools = new Tools(testConfig)
    const bot = await leoTools.getBot('test-archive-bot-id')
    assert.isFalse(!!bot.archived)
    await leoTools.archiveBot('test-archive-bot-id')
    const newBot = await leoTools.getBot('test-archive-bot-id')
    assert.isTrue(newBot.archived)
  }).timeout(5000)
  it('can pause a bot', async () => {
    const leoTools = new Tools(testConfig)
    const bot = await leoTools.getBot('test-pause-bot-id')
    assert.isFalse(!!bot.paused)
    await leoTools.pauseBot('test-pause-bot-id')
    const trueBot = await leoTools.getBot('test-pause-bot-id')
    assert.isTrue(trueBot.paused)
    await leoTools.pauseBot('test-pause-bot-id', false)
    const falseBot = await leoTools.getBot('test-pause-bot-id')
    assert.isFalse(falseBot.paused)
  }).timeout(5000)
  it('can query a bot with instances', async () => {
    const leoTools = new Tools(testConfig)
    const bots = await leoTools.getBotsContaining(null, {
      instances: { ComparisonOperator: 'NOT_NULL' }
    })
    expect(bots).to.be.an('array').lengthOf(2)
    expect(bots[0]).to.have.any.keys('instances')
    expect(bots[1]).to.have.any.keys('instances')
  }).timeout(5000)
  it('can purge instance logs', async () => {
    const leoTools = new Tools(testConfig)
    await leoTools.purgeInstanceLogs('test-not-rogue-bot-two', 0)
    const bot = await leoTools.getBot('test-not-rogue-bot-two')
    expect(bot.instances['0']).to.have.any.keys('logs')
    expect(bot.instances['0'].logs).to.deep.equal({
      errors: [],
      notices: []
    })
  }).timeout(5000)
})
