'use strict'
const fs = require('fs')
const path = require('path')
const parse = require('parse-gitignore')
const findUp = require('find-up')
const ignore = require('ignore')
const merge = require('lodash/merge')

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
				const subDirInfos = getDirInfo(dirInfo.path)
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
		const dirInfos = getDirInfo(folder)
		const folderResource = findResourceInDirectoryInfos(dirInfos)
		return merge(resource, folderResource)
	}
}

module.exports = async (serverless) => {
	serverless.cli.log(`Start`)
	const gitignorepath = await findUp('.gitignore')
	const ignoreResourcePatterns = parse(fs.readFileSync(gitignorepath))
	const getContent = getContentFactory(serverless)
	const keys = Object.keys(serverless.service.custom.convention)
	return keys.reduce((acc, key) => {
		if (serverless.service.custom.convention[key].pattern && serverless.service.custom.convention[key].folders) {
		const findResourcesInDirInfos = findResourceInDirectoryInfosFactory(serverless.service.custom.convention[key].pattern, ignoreResourcePatterns, getContent, serverless)
		acc[key] = serverless.service.custom.convention[key].folders.reduce(folderResourceReducer(findResourcesInDirInfos), {})
		} else {
		throw new Error(`Include "${key}" is missing pattern or folders.`)
		}
		return acc
	}, {})
}
