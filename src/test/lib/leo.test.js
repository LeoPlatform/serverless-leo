'use strict'

const expect = require('chai').expect
const cloneDeep = require('lodash/cloneDeep')
const testServerless = require('./testServerless')

const helloNodeWorldLambda = {
  'handler': 'helloNode.handler',
  'memorySize': 128,
  'timeout': 10,
  'name': 'hello-serverless-leo-world-dev-helloNodeWorld',
  'package': {
    'artifact': '.serverless\\helloNodeWorld.zip'
  },
  'memory': 128,
  'runtime': 'nodejs8.10',
  'vpc': {}
}

describe('compileLeo', () => {
  it('does not add LeoRegister to cloudformation if there is no leo event or leoCron specified', async () => {
    const sls = testServerless()
    sls.serverless.service.functions.helloNodeWorld = helloNodeWorldLambda
    await sls.compileLeo()
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources).not.to.have.property('LeoRegister0')
  })
  it('adds LeoRegister to cloudformation if there is a leo event specified', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        'leo': 'test_hello'
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources).to.have.property('LeoRegister0')
  })
  it('adds LeoRegister to cloudformation if there is register is set to true', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        leo: {
          register: true
        }
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources).to.have.property('LeoRegister0')
  })
  it('adds LeoRegister to cloudformation if there is a leoCron specified', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        leo: {
          cron: '* * * * * *'
        }
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources).to.have.property('LeoRegister0')
  })
  it('adds 5 bots to leoRegister with botCount set to 5', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        'leo': {
          botCount: 5,
          name: 'test_hello',
          queue: 'something'
        }
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(Object.keys(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0'].Properties).length).to.equal(6)
  })
  it('adds 2 bots to leoRegister with 2 source queues', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        'leo': 'test_hello'
      },
      {
        'leo': 'test_hello_2'
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(Object.keys(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0'].Properties).length).to.equal(3)
  })
  it('adds 10 bots to leoRegister with botCount set to 5 and 2 source queues', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        'leo': {
          queue: 'test_hello',
          botCount: 5
        }
      },
      {
        'leo': {
          queue: 'test_hello2',
          botCount: 5
        }
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(Object.keys(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0'].Properties).length).to.equal(11)
  })
  it('names the bots properly', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        'leo': {
          queue: 'test_hello',
          botCount: 2
        }
      },
      {
        'leo': {
          queue: 'test_hello2',
          botCount: 2
        }
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0']
      .Properties['hello-serverless-leo-world-dev-helloNodeWorld_test_hello'].name).to.equal('helloNodeWorld_test_hello')
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0']
      .Properties['hello-serverless-leo-world-dev-helloNodeWorld_test_hello2'].name).to.equal('helloNodeWorld_test_hello2')
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0']
      .Properties['hello-serverless-leo-world-dev-helloNodeWorld_test_hello_1'].name).to.equal('helloNodeWorld_test_hello_1')
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0']
      .Properties['hello-serverless-leo-world-dev-helloNodeWorld_test_hello2_1'].name).to.equal('helloNodeWorld_test_hello2_1')
  })
  it('names the bot according to the config', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        'leo': 'test_hello'
      }
    ]
    lambda.botName = 'bot1'
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0']
      .Properties['hello-serverless-leo-world-dev-helloNodeWorld_test_hello'].name).to.equal('bot1')
  })
  it('names the bot according to the config in events', async () => {
    const sls = testServerless()
    const lambda = cloneDeep(helloNodeWorldLambda)
    lambda.events = [
      {
        'leo': {
          'queue': 'test_hello',
          'name': 'bot2'
        }
      }
    ]
    sls.serverless.service.functions.helloNodeWorld = lambda
    await sls.compileLeo()
    expect(sls.serverless.service.provider.compiledCloudFormationTemplate.Resources['LeoRegister0']
      .Properties['hello-serverless-leo-world-dev-helloNodeWorld_test_hello'].name).to.equal('bot2')
  })
})
