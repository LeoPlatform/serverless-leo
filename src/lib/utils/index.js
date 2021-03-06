const fs = require('fs')

const replaceTextPairsInFile = (filePath, replacementPairs) => {
  let fileContent = fs.readFileSync(filePath).toString()
  replacementPairs.forEach((replacementPair) => {
    fileContent = fileContent.replace(new RegExp(replacementPair[0], 'g'), replacementPair[1])
  })
  fs.writeFileSync(filePath, fileContent)
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
    } else if (result.isDir) {
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

const getBotInfo = (serviceName, stage, ymlFunctionName, leoEvents, leoEventIndex, config, botNumber) => {
  let id
  let cron
  let name
  const prefix = config && config.prefix ? `${config.prefix}` : undefined
  const suffix = config && config.suffix ? `${config.suffix}` : undefined
  const botPrefix = prefix ? `${prefix}-` : ''
  const source = config ? config.source : leoEvents[leoEventIndex].leo
  const destination = config ? config.destination : undefined
  let botSuffix = suffix ? `-${suffix}` : botNumber > 0 ? '-' + botNumber : ''
  // If there is no botPrefix, no source queue and multiple bots: add the eventIndex to the botSuffix (bot id ultimately)
  if (!botPrefix && !suffix && !source && leoEvents.length > 1) {
    botSuffix = `-${leoEventIndex}${botSuffix}`
  }
  // Only add the queue to the bot name if there are multiple events and no prefix
  if (source && !botPrefix && leoEvents.length > 1) {
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
  return {
    cron,
    id,
    name,
    prefix,
    source,
    destination,
    register: config && config.register,
    suffix
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

module.exports = {
  getBotInfo,
  getDirInfo,
  replaceTextPairsInFile,
  replaceTextPairsInFilesInFolder,
  renameFilesInFolder,
  recursePathAndOperate,
  ymlToJson
}
