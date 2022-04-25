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
  constructor(serverless, options) {
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
                shortcut: 'l',
                default: 'node'
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
          function: {
            usage: 'Specify the name of the function for the bot',
            shortcut: 'f',
            type: 'string'
          },
          name: {
            usage: 'Specify the name of the bot',
            shortcut: 'n',
            type: 'string'
          },
          runner: {
            usage: 'Way to invoke the bot.  node|serverless|sls  default: node',
            shortcut: 'r',
            type: 'string',
            default: 'node'
          },
          mockDir: {
            usage: 'Directory of the mock data',
            shortcut: 'md',
            type: 'string'
          },
          mockFlag: {
            usage: 'mock data using default dir .mock-data',
            shortcut: 'm',
            type: 'boolean'
          },
          workflow: {
            usage: 'Invoke down stream bots',
            shortcut: 'w',
            type: 'boolean'
          },
          actualSource: {
            usage: 'Source Bot will read from bus when mocking',
            shortcut: 's',
            type: 'boolean'
          }

          // TODO flag to mock source only

          // TODO way to link multiple projects for workflow
        }
      }
    }

    serverless.configSchemaHandler.defineFunctionEvent(serverless.service.provider.name, 'leo', {
      type: 'object',
      properties: {
        cron: { type: 'string' },
        destination: { type: 'string' }
      },
      required: [],
      additionalProperties: true
    })

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
      'invoke-bot:leo-local': async () => {
        let opts = { ...this.serverless.pluginManager.cliOptions }
        let webpackPlugin = this.serverless.pluginManager.plugins.find(s => s.constructor.name === 'ServerlessWebpack')

        // Setup the node runner
        if (opts.runner === 'node' && (this.serverless.service.provider.runtime || '').match(/^nodejs/)) {
          // Try and find the tsconfig build directory
          let tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json')
          if (fs.existsSync(tsConfigPath)) {
            let tsConfig = {}
            try {
              tsConfig = require(tsConfigPath)
            } catch (err) {
              // remove any trailing commas and try to parse it again
              let tsConfigContent = fs.readFileSync(tsConfigPath).toString()
                .replace(/[\n\r]+[ \t]*/g, '').replace(/,([}\]])/, '$1')

              tsConfig = JSON.parse(tsConfigContent)
            }

            // Set serverless directory to the tsconfig output directory
            let outDir = (tsConfig.compilerOptions || {}).outDir || '.'
            this.serverless.serviceDir = path.resolve(this.serverless.serviceDir, outDir)
          }

          // Remove any webpack local invoke hooks
          // We are bypassing webpack and running the code directly via node
          let beforeInvokeHook = (this.serverless.pluginManager.hooks['before:invoke:local:invoke'] || [])
          this.serverless.pluginManager.hooks['before:invoke:local:invoke'] = beforeInvokeHook.filter(s => s.pluginName !== 'ServerlessWebpack')
          webpackPlugin = null
        } else {
          // If they have already build the project disable webpack builds
          if (webpackPlugin != null) {
            // Build once and then disable webpack builds
            execSync('serverless webpack')
            this.serverless.service.custom.webpack = Object.assign(this.serverless.service.custom.webpack || {}, { noBuild: true })
          }
        }

        // Support mock data streams
        if (opts.mockDir || opts.mockFlag) {
          process.env.RSTREAMS_MOCK_DATA = path.resolve(process.cwd(), options.mockDir || '.mock-data')
        }

        // Mark Source queue from the first bot as reading from the actual bus
        // Only applies if mocking and actualSource is enabled
        if ((opts.mockDir || opts.mockFlag) && opts.actualSource) {
          let event = utils.buildBotInvocationEvent(this.serverless, this.serverless.pluginManager.cliOptions)
          let queue = event.queue || event.source
          if (queue != null) {
            process.env[`RSTREAMS_MOCK_DATA_Q_${queue}`] = 'passthrough'
          }
        }

        let invokedBots = new Set()
        let queuesThatGotData = new Set()
        let botsToInvoke = [{ function: opts.function, name: opts.name, botNumber: opts.botNumber }]

        let serviceDir = this.serverless.serviceDir

        for (let functionData of botsToInvoke) {
          // Service directory may have been changed from a previous bot invoke, just reset it back
          this.serverless.serviceDir = serviceDir
          let functionKey = functionData.function
          let event = utils.buildBotInvocationEvent(this.serverless, functionData)

          this.serverless.cli.log(`\nInvoking local lambda ${functionKey} with data: ${JSON.stringify(event)}`)

          // Setup the function to run

          // Change global options for other plugins
          this.options.function = functionKey
          this.options.data = JSON.stringify(event)

          // Fix webpack references if used
          if (webpackPlugin != null) {
            webpackPlugin.options.function = functionKey
            if (opts.workflow) {
              // Need to reset webpack config require because entries get set once
              // for the first function and then cause an error for subsquent calls
              // So it needs to re import the file for each function
              let file = webpackPlugin.configuration && (webpackPlugin.configuration.config || webpackPlugin.configuration.webpackConfig)
              if (typeof file === 'string') {
                let webpackConfigPath = path.join(this.serverless.config.servicePath, file)
                delete require.cache[require.resolve(webpackConfigPath)]
              }
            }
          }

          // Clean Env Vars
          let func = this.serverless.service.getFunction(functionKey)
          utils.removeExternallyProvidedServerlessEnvironmentVariables(this.serverless, func)

          // Invoke the function
          await this.serverless.pluginManager.spawn('invoke:local')

          // Add down stream bots to invoke list
          if (opts.workflow) {
            invokedBots.add(functionKey)

            // Get list of queues with new data
            let queuesWithNewData = []
            Object.keys(process.env).forEach(k => {
              // mock-wrapper will flag a queue that gets new data
              // by adding an env var `RSTREAMS_MOCK_DATA_Q_${queue}`
              let [, queue] = k.match(/^RSTREAMS_MOCK_DATA_Q_(.*)$/) || []

              if (queue != null && !queuesThatGotData.has(queue)) {
                // If it is a queue that hasn't received data already
                // add it to the list and mark it
                queuesThatGotData.add(queue)
                queuesWithNewData.push(queue)
              }
            })

            // Get any bots that are triggered by the new queues
            let bots = utils.getBotsTriggeredFromQueues(this.serverless, queuesWithNewData)
              .map(f => ({ function: f.function }))
              .filter(f => !invokedBots.has(f.function))

            // Add the bots to the list to invoke
            botsToInvoke.push(...bots)
          }
        }
      }
    }
  }
}

module.exports = ServerlessLeo
