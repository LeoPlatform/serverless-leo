'use strict'

// Serverless LifeCycle cheat sheet https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

const BbPromise = require('bluebird')
const path = require('path')
const validate = require('./lib/validate')
const compileLeo = require('./lib/leo')
const utils = require('./lib/utils')
const Tools = require('./tools')
const AWS = require('aws-sdk')

// TODO: sls create - Place tempates in memorable cdn location like https://dsco.io/aws-nodejs-leo-microservice
// TODO: sls create bot - Place all templates in memorable cdn location, and publish them, but also create the schortcuts like `sls create bot --name my-bot-name`
// TODO: make typescript templates aws-typescript-leo-microservice etc...
// TODO: sls create entity - to create a "Lagom" like entity to for business application microservices
// TODO: make a crossover test `sls invoke local --function hello` like `leo-cli test`
// TODO: test validation phase - that it complains there are no valid sections

class ServerlessLeo {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('aws')
    this.commands = {
      leo: {
        commands: {
          'list-bots': {
            usage: 'List the bots from your leo bus',
            lifecycleEvents: [
              'create-leo-tools',
              'get-bots'
            ]
            // TODO: pagination options like AWS
            // options: {
            //   'starting-token': {
            //     usage: 'Used for pagination. Token where you left off (NextToken)'
            //   },
            //   'max-items': {
            //     usage: 'Total number of items to return'
            //   }
            // }
          }
        }
      },
      create: {
        commands: {
          bot: {
            usage: 'Create a nodejs microservice',
            lifecycleEvents: [
              'copy-template',
              'replace-tokens'
            ],
            options: {
              name: {
                usage: 'Specify the name of the bot',
                shortcut: 'n'
              }
            }
          }
        }
      }
    }

    Object.assign(
      this,
      validate,
      compileLeo
    )

    this.hooks = {
      'leo:list-bots:create-leo-tools': async () => {
        if (!serverless.service.provider.leo) {
          return Promise.reject(new Error('Missing required provider:leo'))
        }
        if (!serverless.service.provider.leo.stack) {
          return Promise.reject(new Error('Missing required provider:leo:stack'))
        }
        var cloudformation = new AWS.CloudFormation()
        var params = { StackName: serverless.service.provider.leo.stack }
        const stacks = await cloudformation.describeStacks(params).promise()
        const validStackStatuses = ['CREATE_COMPLETE', 'ROLLBACK_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']
        const validStacks = stacks.Stacks.filter(s => validStackStatuses.includes(s.StackStatus))
        if (validStacks.length === 0) {
          return Promise.reject(new Error('Stack in invalid status'))
        }
        if (validStacks.length > 1) {
          return Promise.reject(new Error('Multiple stacks match criteria'))
        }
        const stackOutputs = validStacks[0].Outputs
        const toolsConfig = {
          tables: {
            // register: stackOutputs.find(o => o.OutputKey === 'Register').OutputValue,
            // region: stackOutputs.find(o => o.OutputKey === 'Region').OutputValue,
            bot: stackOutputs.find(o => o.OutputKey === 'LeoCron').OutputValue,
            settings: stackOutputs.find(o => o.OutputKey === 'LeoSettings').OutputValue,
            events: stackOutputs.find(o => o.OutputKey === 'LeoEvent').OutputValue,
            s3: stackOutputs.find(o => o.OutputKey === 'LeoS3').OutputValue,
            system: stackOutputs.find(o => o.OutputKey === 'LeoSystem').OutputValue
          }
        }
        serverless.variables.leoTools = new Tools(toolsConfig)
      },
      'leo:list-bots:get-bots': async () => {
        const { leoTools } = serverless.variables
        const bots = await leoTools.getBotsContaining()
        console.log(JSON.stringify({ Items: bots }, null, 2))
      },
      'create:bot:copy-template': () => {
        this.serverless.pluginManager.cliOptions['template-url'] = 'https://github.com/LeoPlatform/serverless-leo/tree/master/templates/bot'
        const { name } = this.serverless.pluginManager.cliOptions
        this.serverless.pluginManager.cliOptions['path'] = `bots${path.sep}${name}`
        return this.serverless.pluginManager.run(['create'])
      },
      'create:bot:replace-tokens': () => {
        const { path, name } = this.serverless.pluginManager.cliOptions
        utils.replaceTextInFilesInFolder(path, 'NAME_TOKEN', name)
        return Promise.resolve()
      },
      'before:package:cleanup': () => BbPromise.bind(this).then(this.gatherBots),
      'after:package:compileFunctions': () => {
        this.validated = this.validate()
        if (this.validated.errors.length > 0) {
          return Promise.reject(this.validated.errors)
        }

        if (this.validated.streams.length === 0) {
          this.serverless.cli.log('Warning: serverless-leo plugin is included but not being used.')
          return BbPromise.resolve()
        }

        return BbPromise.bind(this)
          .then(this.compileLeo)
      }
    }
  }
}

module.exports = ServerlessLeo
