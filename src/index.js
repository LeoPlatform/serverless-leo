'use strict'

// Serverless LifeCycle cheat sheet https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

const BbPromise = require('bluebird')
const path = require('path')
const validate = require('./lib/validate')
const compileLeo = require('./lib/leo')
const utils = require('./lib/utils')
const leoTools = require('./tools')

// TODO: sls create - Place tempates in memorable cdn location like https://dsco.io/aws-nodejs-leo-microservice
// TODO: sls create bot - Place all templates in memorable cdn location, and publish them, but also create the schortcuts like `sls create bot --name my-bot-name`
// TODO: make typescript templates aws-typescript-leo-microservice etc...
// TODO: sls create entity - to create a "Lagom" like entity to for business application microservices
// TODO: make a crossover test `sls invoke local --function hello` like `leo-cli test`
// TODO: test validation phase - that it complains there are no valid sections

class AwsCompileLeo {
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
              'get-bots'
            ],
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
      'leo:list-bots:get-bots': async () => {
        const bots = await leoTools.getBotsContaining()
        console.log(bots);
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

module.exports = AwsCompileLeo
