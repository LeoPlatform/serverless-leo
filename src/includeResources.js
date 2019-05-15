'use strict'
const fs = require('fs')
const parse = require('parse-gitignore')
const findUp = require('find-up')
const {
  findResourceInDirectoryInfosFactory,
  folderResourceReducer,
  getContentFactory
} = require('./includeContent')

module.exports = async (serverless) => {
  const gitignorepath = await findUp('.gitignore')
  const ignoreResourcePatterns = parse(fs.readFileSync(gitignorepath))
  const { resourceFolders, matchResourcePatterns } = serverless.service.custom
  const getContent = getContentFactory(serverless)
  const findResourcesInDirInfos = findResourceInDirectoryInfosFactory(matchResourcePatterns, ignoreResourcePatterns, getContent, serverless)
  return resourceFolders.reduce(folderResourceReducer(findResourcesInDirInfos), {})
}
