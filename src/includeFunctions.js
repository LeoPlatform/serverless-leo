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
  const { functionFolders, matchFunctionPatterns } = serverless.service.custom
  const getContent = getContentFactory(serverless)
  const findResourcesInDirInfos = findResourceInDirectoryInfosFactory(matchFunctionPatterns, ignoreResourcePatterns, getContent, serverless)
  return functionFolders.reduce(folderResourceReducer(findResourcesInDirInfos), {})
}
