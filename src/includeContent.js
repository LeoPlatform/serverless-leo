'use strict'
var path = require('path')
const utils = require('./lib/utils')
const ignore = require('ignore')
const merge = require('lodash/merge')

function getContentFactory (serverless) {
  return (absolutePath) => {
    let content

    const isYml = absolutePath.match(/.*\.yml/i) || absolutePath.match(/.*\.yaml/i)
    if (isYml) {
      content = serverless.utils.readFileSync(absolutePath)
    }
    const isJsOrJSON = absolutePath.match(/.*\.js/i) || absolutePath.match(/.*\.json/i)
    if (isJsOrJSON) {
      content = require(absolutePath)
    }

    return content
  }
}

const findResourceInDirectoryInfosFactory = (matchPatterns, ignorePatterns, getContent, serverless) => {
  const ig = ignore().add(ignorePatterns)
  const ig2 = ignore().add(matchPatterns)
  const findResourceInDirectoryInfos = (dirInfos) => {
    const resources = {}
    dirInfos.forEach(dirInfo => {
      if (dirInfo.isDir && !ig.ignores(dirInfo.path)) {
        const subDirInfos = utils.getDirInfo(dirInfo.path)
        const subDirResources = findResourceInDirectoryInfos(subDirInfos)
        merge(resources, subDirResources)
      } else if (dirInfo.isFile && !ig.ignores(dirInfo.path) && ig2.ignores(dirInfo.path)) {
        var absolutePath = path.resolve(dirInfo.path)
        const resourceContent = getContent(absolutePath)
        if (resourceContent) {
          const contentKeys = Object.keys(resourceContent)
          if (!contentKeys) throw new Error('Resource definition missing.')
          const existingResourceDefinition = contentKeys.some(k => resources.hasOwnProperty(k))
          if (existingResourceDefinition) {
            const duplicateResourceDefinition = contentKeys.find(k => resources.hasOwnProperty(k))
            serverless.cli.log(`WARNING: Resource ${duplicateResourceDefinition} has multiple definitions. They will be merged.)`)
          }
          serverless.cli.log(`Including resource definition: ${dirInfo.path}`)
          merge(resources, resourceContent)
        }
      }
    })
    return resources
  }
  return findResourceInDirectoryInfos
}

const folderResourceReducer = (findResourceInDirectoryInfos) => {
  return (resource, folder) => {
    const dirInfos = utils.getDirInfo(folder)
    const folderResource = findResourceInDirectoryInfos(dirInfos)
    // TODO: check for duplicate keys and WARN
    return merge(resource, folderResource)
  }
}

module.exports = {
  findResourceInDirectoryInfosFactory,
  folderResourceReducer,
  getContentFactory
}
