const fs = require('fs')

const reservedFields = {
  id: true,
  cron: true,
  name: true,
  time: true,
  type: true,
  botNumber: true,
  botCount: true,
  codeOverrides: true,
  prefix: true,
  queue: true,
  source: true,
  destination: true,
  suffix: true
}
const reservedBotFields = {
  tags: true
}

const replaceTextPairsInFile = (filePath, replacementPairs) => {
  let path = filePath
  let fileContent = fs.readFileSync(filePath).toString()
  replacementPairs.forEach((replacementPair) => {
    fileContent = fileContent.replace(new RegExp(replacementPair[0], 'g'), replacementPair[1])
    filePath = filePath.replace(new RegExp(replacementPair[0], 'g'), replacementPair[1])
  })
  fs.writeFileSync(path, fileContent)
  if (path != filePath) {
    fs.renameSync(path, filePath)
  }
}

const getDirInfo = (folderPath) => {
  const dirExists = fs.existsSync(folderPath)
  if (!dirExists) return []

  return fs.readdirSync(folderPath).map(f => {
    const newPath = `${folderPath}/${f}`
    const fStats = fs.statSync(newPath)
    return {
      dir: folderPath,
      path: newPath,
      file: f,
      isFile: fStats.isFile(),
      isDir: fStats.isDirectory()
    }
  })
}

const recursePathAndOperate = (folderPath, fileOperation) => {
  const results = getDirInfo(folderPath)

  results.forEach((result) => {
    if (result.isFile) {
      fileOperation(result.path)
    } else if (result.isDir && !result.file.match(/^node[_-]modules$/)) {
      recursePathAndOperate(result.path, fileOperation)
    }
  })
}

const renameFilesInFolder = (folderPath, subString, newSubString) => {
  recursePathAndOperate(folderPath, (filePath) => {
    fs.renameSync(filePath, filePath.replace(subString, newSubString))
  })
}

const replaceTextPairsInFilesInFolder = (folderPath, replacementPairs) => {
  recursePathAndOperate(folderPath, (filePath) => {
    replaceTextPairsInFile(filePath, replacementPairs)
  })
}

const getBotInfo = (serviceName, stage, ymlFunctionName, leoEvents, leoEventIndex, config, botNumber, pluginConfig = {}) => {
  let id
  let cron
  let name
  const prefix = config && config.prefix ? `${config.prefix}` : undefined
  const suffix = config && config.suffix ? `${config.suffix}` : undefined
  const botPrefix = prefix ? `${prefix}-` : ''
  const source = config ? (config.source || config.queue) : leoEvents[leoEventIndex].leo
  const destination = config ? config.destination : undefined
  let botSuffix = suffix ? `-${suffix}` : botNumber > 0 ? '-' + botNumber : ''
  // If there is no botPrefix, no source queue and multiple bots: add the eventIndex to the botSuffix (bot id ultimately)
  if (!botPrefix && !suffix && !source && leoEvents.length > 1) {
    botSuffix = `-${leoEventIndex}${botSuffix}`
  }

  if (config.id) {
    id = config.id
  }
  // Only add the queue to the bot name if there are multiple events and no prefix
  else if (source && !botPrefix && leoEvents.length > 1) {
    id = `${serviceName}-${stage}-${botPrefix}${source}-${ymlFunctionName}${botSuffix}`
  } else {
    id = `${serviceName}-${stage}-${botPrefix}${ymlFunctionName}${botSuffix}`
  }
  if (config && config.cron) {
    cron = config.cron
  }
  if (config && config.name) {
    name = config.name
  } else {
    name = id.replace(`${serviceName}-${stage}-`, '')
  }

  // If botIdExcludeStage is enabled, remove the stage from the id
  if (pluginConfig.botIdExcludeStage) {
    id = id.replace(`${serviceName}-${stage}-`, `${serviceName}-`)
  }

  // Extract any extra fileds from the leo event
  let extraSettings = Object.entries(config).filter(([key]) => !reservedFields[key] && !reservedBotFields[key]).reduce((a, [key, value]) => { a[key] = value; return a }, {})

  let botFields = Object.entries(config).filter(([key]) => reservedBotFields[key]).reduce((a, [key, value]) => { a[key] = value; return a }, {})

  // Fix tags to be a comma sepreated string
  if (botFields.tags && !Array.isArray(botFields.tags)) {
    botFields.tags = [botFields.tags]
  }
  if (Array.isArray(botFields.tags)) {
    botFields.tags = botFields.tags.map(v => {
      if (v != null && typeof v === 'object') {
        return Object.entries(v).map(([key, value]) => `${key}:${value}`).join(',')
      }
      return v
    }).join(',')
  }

  // Add app tag if it is missing
  if (!botFields.tags || !botFields.tags.match(/app:/)) {
    botFields.tags = [botFields.tags, `app:${serviceName}`].filter(t => t).join(',')
  }

  return {
    cron,
    id,
    name,
    prefix,
    source,
    destination,
    register: config && config.register,
    suffix,
    extraSettings,
    botFields
  }
}

const ymlToJson = yml => {
  if (/\t/.test(yml)) {
    throw new Error('Yml error: tabs are not expected. Use double spaced indentation.')
  }
  try {
    const json = {}
    let section = []
    const spaceRegex = / {2}/g
    const lines = yml.replace(/\r/g, '').split('\n')
    lines.forEach(actualLine => {
      if (/^w*$/.test(actualLine)) {
        return
      }
      let isArrayItem = false
      let line = actualLine
      const spaceMatch = line.match(spaceRegex)
      const indentation = spaceMatch ? spaceMatch.length : 0
      if (/^[\s]*-/.test(line)) {
        line = line.replace(/-/, '')
        isArrayItem = true
      }
      const splitLine = line.replace(spaceRegex, '').split(/:\s/).map(i => i.replace(/^[\s]*/, '').replace(/[\s]*$/, ''))
      const endingColonRegex = /:$/
      const key = splitLine[0].replace(endingColonRegex, '')
      if (indentation < section.length) {
        section = section.slice(0, indentation)
      }
      let objToManipulate = getObjViaPath(json, section)
      if (!objToManipulate) {
        mutateViaPath(json, section, {})
        objToManipulate = getObjViaPath(json, section)
      }
      if (isArrayItem) {
        if (!Array.isArray(objToManipulate)) {
          mutateViaPath(json, section, [])
          objToManipulate = getObjViaPath(json, section)
        }
        if (splitLine[1] === undefined && !endingColonRegex.test(splitLine[0])) {
          objToManipulate.push(key)
        } else {
          const newObject = {}
          newObject[key] = splitLine[1] === '' ? {} : splitLine[1]
          objToManipulate.push(newObject)
          section.push(objToManipulate.length - 1)
        }
      } else {
        objToManipulate[key] = splitLine[1] || ''
      }
      section.push(key)
    })
    return json
  } catch (err) {
    console.log('!!!!! Error parsing yml. Note: it is expected to be in double spaced format.')
    throw err
  }
}

const getObjViaPath = (obj, section) => {
  if (!section || section.length === 0) {
    return obj
  } else if (section[0] === '') {
    return getObjViaPath(obj, section.slice(1, section.length))
  } else {
    return getObjViaPath(obj[section[0]], section.slice(1, section.length))
  }
}

const mutateViaPath = (obj, section, value) => {
  if (section.length === 1) {
    obj[section] = value
  } else if (section[0] === '') {
    mutateViaPath(obj, section.slice(1, section.length), value)
  } else {
    mutateViaPath(obj[section[0]], section.slice(1, section.length), value)
  }
}

/**
 * Override Serverless environment variables with current process.env values
 *
 * This prevents local invoke from failing for environment variables that can't be
 * resolved via the serverless resolver.
 *
 * @param {*} serverless
 * @param {Serverless.FunctionData} func
 */
const removeExternallyProvidedServerlessEnvironmentVariables = (serverless, func) => {
  let env = process.env

  serverless.service.provider.environment = serverless.service.provider.environment || {};

  // invoke-local doesn't account for pre set AWS vars
  // So explicity set them to override the defaults
  ['AWS_REGION', 'AWS_DEFAULT_REGION'].forEach(key => {
    if (process.env[key] != null) {
      serverless.service.provider.environment[key] = process.env[key]
    }
  })

  // Override any provider level environment variables that already exists in process.env
  Object.entries(serverless.service.provider.environment || {}).forEach(([key, value]) => {
    if (env[key] != null) {
      serverless.service.provider.environment[key] = env[key]
    }
  })

  // Override any function level environment variables that already exists in process.env
  Object.entries(func.environment || {}).forEach(([key, value]) => {
    if (env[key] != null) {
      func.environment[key] = value
    }
  })
}

/**
 *  Create the BotInvocationEvent for the given function
 *
 * @param {*} serverless
 * @param {function?:string, name?:string, botNumber?:number} options
 * @returns BotInvocationEvent
 */
const buildBotInvocationEvent = (serverless, options) => {
  const { function: functionName, name, botNumber = 0 } = options

  // Find the serverless function that matches the options
  const lambdaName = functionName || name
  const regex = new RegExp(lambdaName)
  const functions = Object.keys(serverless.service.functions)
  const matchingFunctions = functions.filter(i => regex.test(i))
  let functionKey
  if (matchingFunctions.length > 1) {
    functionKey = matchingFunctions.find(i => i === lambdaName)
    if (!functionKey) {
      throw new Error(`Multiple matches found for bot name/lambda, please be more specific. ${matchingFunctions.join(', ')}`)
    }
  } else if (matchingFunctions.length === 1) {
    functionKey = matchingFunctions[0]
  } else {
    throw new Error('Could not match bot name/lambda in serverless defined functions.')
  }
  const serverlessJson = serverless.service.getFunction(functionKey)

  // Find the leo event that matches functionKey and name
  let event
  let eventIndex = 0
  if (serverlessJson.events.length === 1) {
    event = serverlessJson.events[0].leo
  } else {
    // Find the leo event that exact matches `name`
    let filteredEvents = serverlessJson.events.filter((event, index) => {
      if (Object.values(event.leo).some(leoKey => name === leoKey)) {
        eventIndex = index
        return true
      }
    })

    if (filteredEvents.length === 1) {
      event = filteredEvents[0].leo
    } else {
      // Find the leo event that regex matches `name`
      filteredEvents = serverlessJson.events.filter((event, index) => {
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

  const botInfo = getBotInfo(
    serverless.service.service,
    serverless.service.provider.stage,
    functionKey,
    serverlessJson.events,
    eventIndex,
    event,
    botNumber,
    serverless.service.custom.leo || {}
  )

  // Add local invocation overrides
  Object.entries({ ...process.env, ...serverless.pluginManager.cliOptions }).forEach(([key, value]) => {
    let command = key.match(/^leo[_-](event|env)[_-](.*)$/i)
    if (command) {
      let obj = process.env
      let field = command[2]

      if (command[1] === 'event') {
        let path = field.split('.')
        field = path.pop()
        obj = path.reduce((a, b) => a[b] = a[b] || {}, event)
      }

      if (value.match(/^\d+(?:\.\d*)?$/)) {
        value = parseFloat(value)
      }

      obj[field] = value
    }
  })

  // Create the BotInvocationEvent structure
  event.botId = botInfo.id
  event.__cron = {
    id: botInfo.id,
    iid: '0',
    ts: Date.now(),
    force: true,
    ignoreLock: process.env.IGNORE_LOCK === 'true'
  }
  return event
}

/**
 * returns an array of functions that listen to any of the queues
 *
 * @param {*} serverless
 * @param {string[]} queues
 * @returns { function:string; data: Serverless.FunctionData }
 */
const getBotsTriggeredFromQueues = (serverless, queues = []) => {
  queues = new Set(queues)
  return Object.entries(serverless.service.functions).filter(([_k, f]) => {
    return (f.events || []).some(e => e.leo != null &&
      (
        (typeof e.leo === 'string' && queues.has(e.leo)) ||
        (queues.has(e.leo.source || e.leo.queue))
      )
    )
  }).map(([key, value]) => ({ function: key, data: value }))
}

async function fetchAll(fn) {
  let response = {}
  do {
    let r = await fn(response && response.NextToken)

    delete response.NextToken
    Object.entries(r).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        response[key] = (response[key] || []).concat(value)
      } else {
        response[key] = value
      }
    })
  } while (response.NextToken)
  return response
}

module.exports = {
  getBotInfo,
  getDirInfo,
  replaceTextPairsInFile,
  replaceTextPairsInFilesInFolder,
  renameFilesInFolder,
  recursePathAndOperate,
  ymlToJson,
  removeExternallyProvidedServerlessEnvironmentVariables,
  buildBotInvocationEvent,
  getBotsTriggeredFromQueues,
  fetchAll
}
