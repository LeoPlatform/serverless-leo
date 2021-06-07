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
            usage: 'Create a leo bot',
            lifecycleEvents: [
              'copy-template',
              'replace-tokens'
            ],
            options: {
              name: {
                usage: 'Name of the bot',
                type: 'string',
                shortcut: 'n',
                required: true
              },
              language: {
                usage: 'Programming language of the bot. Defaults to node [node|typescript]',
                type: 'string',
                shortcut: 'l'
              },
              path: {
                usage: `Output path of the bot. Defaults to bots${path.sep}{name}`,
                type: 'string'
              },
              type: {
                usage: 'Stream type of the bot. Defaults to load [load|enrich|offload]',
                type: 'string',
                default: 'load'
              },
              source: {
                usage: 'Source queue to read from. Defaults to {name}_source',
                type: 'string'
              },
              destination: {
                usage: 'Destination queue to write to. Defaults to {name}_destination',
                type: 'string'
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
            shortcut: 'b',
            type: 'string'
          },
          functionName: {
            usage: 'Specify the name of the function for the bot',
            shortcut: 'f',
            type: 'string'
          },
          name: {
            usage: 'Specify the name of the bot',
            shortcut: 'n',
            type: 'string'
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
        let {
          language,
          name,
          path: outputPath,
          type
        } = this.serverless.pluginManager.cliOptions
        outputPath = outputPath || `bots${path.sep}${name}`

        const templateUrl = `https://github.com/LeoPlatform/serverless-leo/tree/master/templates/bot/${language}/${type}`
        this.options['template-url'] = templateUrl
        this.options.path = outputPath

        this.serverless.pluginManager.cliOptions['template-url'] = templateUrl // TODO: old version of serverless?
        this.serverless.pluginManager.cliOptions.path = outputPath // TODO: old version of serverless?
        return this.serverless.pluginManager.run(['create'])
      },
      'create:bot:replace-tokens': () => {
        const {
          name,
          path,
          source,
          destination
        } = this.serverless.pluginManager.cliOptions
        
        const replacements = [
          ['NAME_TOKEN', name],
          ['SOURCE_TOKEN', source || `${name}_source`],
          ['DESTINATION_TOKEN', destination || `${name}_destination`]
        ]
        utils.replaceTextPairsInFilesInFolder(path, replacements)
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
        const { functionName, name, botNumber = 0 } = this.serverless.pluginManager.cliOptions
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
        const botInfo = utils.getBotInfo(this.serverless.service.service, this.serverless.service.provider.stage, functionKey, serverlessJson[functionKey].events, eventIndex, event, botNumber)
        event.botId = botInfo.id
        event.__cron = {
          id: botInfo.id,
          iid: '0',
          ts: Date.now(),
          force: true
        }
        this.serverless.cli.log(`Invoking local lambda ${functionKey} with data: ${JSON.stringify(event)}`)
        const environmentSetString = Object.entries(process.env).filter(i => !/ /.test(i[1])).map(([key, value]) => ` -e ${key}="${value}"`).join('')
        return execSync(`serverless invoke local -f ${functionKey} -d ${JSON.stringify(JSON.stringify(event))}${environmentSetString}`, { stdio: 'inherit' })
      }
    }
  }
}

module.exports = ServerlessLeo
