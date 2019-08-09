'use strict'

// Serverless LifeCycle cheat sheet https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

const { execSync } = require('child_process')
const BbPromise = require('bluebird')
const path = require('path')
const fs = require('fs')
const validate = require('./lib/validate')
const compileLeo = require('./lib/leo')
const utils = require('./lib/utils')

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
      },
      'invoke-bot': {
        usage: 'Run a leo bot locally',
        lifecycleEvents: [
          'leo-local'
        ],
        options: {
          botNumber: {
            usage: 'Specify the bot number (default is 0)',
            shortcut: 'b'
          },
          functionName: {
            usage: 'Specify the name of the function for the bot',
            shortcut: 'f'
          },
          name: {
            usage: 'Specify the name of the bot',
            shortcut: 'n'
          },
          stage: {
            usage: 'Specify the stage of the bot',
            shortcut: 's'
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
          return Promise.reject(this.validated.errors.join('\n'))
        }

        if (this.validated.streams.length === 0) {
          this.serverless.cli.log('Warning: serverless-leo plugin is included but not being used.')
          return BbPromise.resolve()
        }

        return BbPromise.bind(this)
          .then(this.compileLeo)
      },
      'invoke-bot:leo-local': () => {
        const { functionName, name, stage = 'test', botNumber = 0 } = this.serverless.pluginManager.cliOptions
        const lambdaName = functionName || name
        const regex = new RegExp(lambdaName)
        const functions = Object.keys(this.serverless.service.functions)
        const matchingFunctions = functions.filter(i => regex.test(i))
        let functionKey
        if (matchingFunctions.length > 1) {
          functionKey = matchingFunctions.find(i => i === lambdaName)
          if (!functionKey) {
            throw new Error('Multiple matches found for bot name/lambda, please be more specific.')
          }
        } else if (matchingFunctions.length === 1) {
          functionKey = matchingFunctions[0]
        } else {
          throw new Error('Could not match bot name/lambda in serverless defined functions.')
        }
        const pathSegments = this.serverless.service.functions[functionKey].handler.split(/\//)
        pathSegments[pathSegments.length - 1] = 'serverless.yml'
        const serverlessYml = fs.readFileSync(path.join(...pathSegments)).toString()
        const serverlessJson = utils.ymlToJson(serverlessYml)
        // Build the event to invoke the lambda with
        let event
        let eventIndex = 0
        if (serverlessJson[functionKey].events.length === 1) {
          event = serverlessJson[functionKey].events[0].leo
        } else {
          let filteredEvents = serverlessJson[functionKey].events.filter((event, index) => {
            if (Object.values(event.leo).some(leoKey => name === leoKey)) {
              eventIndex = index
              return true
            }
          })
          if (filteredEvents.length === 1) {
            event = filteredEvents[0].leo
          } else {
            filteredEvents = serverlessJson[functionKey].events.filter((event, index) => {
              if (Object.values(event.leo).some(leoKey => new RegExp(name).test(leoKey))) {
                eventIndex = index
                return true
              }
            })
            if (filteredEvents.length === 1) {
              event = filteredEvents[0].leo
            }
          }
        }
        if (!event) {
          throw new Error('Could not match the bot name with the bot configurations')
        }
        const botInfo = utils.getBotInfo(this.serverless.service.service, stage, functionKey, serverlessJson[functionKey].events, eventIndex, event, botNumber)
        event.botId = botInfo.id
        event.__cron = {
          id: botInfo.id,
          iid: '0',
          ts: Date.now(),
          force: true
        }
        this.serverless.cli.log(`Invoking local lambda ${functionKey} with data: ${JSON.stringify(event)}`)
        return execSync(`serverless invoke local -f ${functionKey} -d ${JSON.stringify(JSON.stringify(event))}`, { stdio: 'inherit' })
      }
    }
  }
}

module.exports = ServerlessLeo
