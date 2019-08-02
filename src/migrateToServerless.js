/*

This script can be used to convert existing leo microservices to serverless.
It may not cover everything as it converts from package.json to serverless.yml so it will leave the package.json for reference.
The intention is that the package.json is removed once the configuration it has is fully replaced.

Run this script by passing the microservice directory name, or by placing the script directly into a microservice directory.

*/

const fs = require('fs')
const path = require('path')

const microserviceDirectory = path.join(__dirname, process.argv[2] || '')

async function recursiveFind (regex, absPath = __dirname, options = {}) {
  const matchFolders = options.matchFolders
  const deepFolderMatch = options.deepFolderMatch
  const ignoreRegex = options.ignoreRegex

  const matchedFiles = []
  const filesFolders = await new Promise((resolve, reject) => {
    fs.readdir(absPath, (err, files) => {
      if (err) {
        return reject(err)
      }
      return resolve(files)
    })
  })
  await Promise.all(filesFolders.map(async ff => {
    if (ignoreRegex.test(ff)) {
      // Skip if it matches the ignore regular expression
      return
    }
    const isDirectory = await new Promise((resolve, reject) => {
      fs.stat(path.join(absPath, ff), (err, stats) => {
        if (err) {
          return reject(err)
        }
        resolve(stats.isDirectory())
      })
    })
    if (isDirectory) {
      if (matchFolders && regex.test(ff)) {
        matchedFiles.push(path.join(absPath, ff))
      }
      if (deepFolderMatch || !matchFolders || !regex.test(ff)) {
        matchedFiles.push(...(await recursiveFind(regex, path.join(absPath, ff), options)))
      }
    } else {
      if (!matchFolders && regex.test(ff)) {
        matchedFiles.push(path.join(absPath, ff))
      }
    }
  }))
  return matchedFiles
}

function replaceObject (obj) {
  if (Array.isArray(obj)) {
    return `- ${obj.map(i => replaceObject(i)).join('\n      - ')}`
  }
  let string = JSON.stringify(obj)
  string = string.replace(/\{"Fn::ImportValue":\{"Fn::Sub":"(.*)"}}$/, 'Fn::ImportValue: !Sub $1')
  string = string.replace(/\{"Fn::Sub":"(.*)"}$/, 'Fn::ImportValue: !Sub $1')
  string = string.replace(/\{"Fn::FindInMap":\["(.*)",{"Ref":"(.*)"},"(.*)"]}/, `Fn::FindInMap:
        - $1
        - !Ref '$2'
        - $3`)
  string = string.replace(/\{"Fn::FindInMap":\["(.*)","(.*)","(.*)"]}/, `Fn::FindInMap:
        - $1
        - $2
        - $3`)
  return string
}

recursiveFind(/package\.json/, microserviceDirectory, { ignoreRegex: /node_modules/ }).then(packageJsons => {
  packageJsons.forEach(packageJsonPath => {
    const packageJson = require(packageJsonPath)
    let directory = packageJsonPath.replace(microserviceDirectory, '').replace(/\\/g, '/').replace(/\/package.json/, '').replace(/^\//, '')
    let serverlessYml
    if (!packageJson.config) {
      console.log('Skipping: missing config in package.json', packageJsonPath)
      return
    }
    if (!packageJson.config.leo) {
      console.log('Skipping: missing config.leo in package.json', packageJsonPath)
      return
    }
    if (packageJson.config.leo.type === 'microservice') {
      let hasLeoCliConfig = fs.existsSync(path.join(microserviceDirectory, directory, 'leo_cli_config.js'))
      serverlessYml = `service: NAME_THE_MICROSERVICE

plugins:
  - serverless-leo
  - serverless-webpack

package:
  individually: true

custom:
  functionFolders:
    - api
    - bots
  resourceFolders:
    - cloudformation
  matchFunctionPatterns:
    - '*.yml'
  matchResourcePatterns:
    - '*.yml'
    - '*.js'
    - '*.json'
  test:
    leoStack: TestBus
  staging:
    leoStack: StagingBus
  prod:
    leoStack: ProdBus
  ${hasLeoCliConfig ? '' : '# '}leoDeployParams: \${{file(../node_modules/serverless-leo/leoCliDeployAccessor.js)}} # Pulling in deployment config from leo_cli_config

provider:
  name: aws
  runtime: nodejs10.x
  stage: \${{opt:stage, 'test'}}
  environment:
    LEO_ENVIRONMENT: \${{opt:stage, 'test'}}
  region: \${{opt:region, 'us-east-1'}}
  # stackName: \${{self:custom.leoDeployParams.\${{self:provider.stage}}.stack}} # Using approprate stack name from leo_cli_config
  variableSyntax: "\\\\\${{([ ~:a-zA-Z0-9._@\\\\'\\",\\\\-\\\\/\\\\(\\\\)]+?)}}" # Allow Cloudformation to use \${}. Serverless will use \${{}}.

functions:
  - \${{file(../node_modules/serverless-leo/includeFunctions.js)}} # Auto-include functions recursively from functionFolders that matchFunctionPatterns

resources:
  - \${{file(../node_modules/serverless-leo/includeResources.js)}} # Auto-include resources recursively from resourceFolders that matchResourcePatterns
  ${hasLeoCliConfig ? '' : '# '}- \${{file(../node_modules/serverless-leo/defaultLeoParameters.js)}} # Apply Leo Parameters to Cloudformation - requires self:custom.leoDeployParams
`
    } else {
      serverlessYml = `${packageJson.name || 'NAME_THE_BOT'}:
  handler: ${directory}/index.handler
  description: ${packageJson.description}
  memorySize: ${packageJson.config.leo.memory || 256}
  timeout: ${packageJson.config.leo.timeout || 300}
  role: ${packageJson.config.leo.role || 'ApiRole'}
  layers:
    - \${{cf:layer-\${{self:provider.stage}}.LeoLambdaLayerQualifiedArn}}`
      if (packageJson.config.leo.VpcConfig) {
        serverlessYml += '\n  vpc:'
        Object.keys(packageJson.config.leo.VpcConfig).forEach(key => {
          serverlessYml += `\n    ${key.replace(/^./, value => value.toLowerCase())}:`
          serverlessYml += `\n      ${replaceObject(packageJson.config.leo.VpcConfig[key])}`
        })
      }
      if (packageJson.config.leo.env) {
        serverlessYml += '\n  environment:'
        Object.keys(packageJson.config.leo.env).forEach(key => {
          serverlessYml += `\n    ${key}:`
          serverlessYml += `\n      ${replaceObject(packageJson.config.leo.env[key])}`
        })
      }
      serverlessYml += '\n  events:'
      if (packageJson.config.leo.cron && !packageJson.config.leo.variations && (packageJson.config.leo.cron.time || packageJson.config.leo.cron.settings.source)) {
        serverlessYml += `\n    - leo:`
        if (packageJson.config.leo.cron.time) {
          serverlessYml += `\n        cron: ${packageJson.config.leo.cron.time}`
        } else {
          serverlessYml += `\n        queue: ${packageJson.config.leo.cron.settings.source}`
        }
      }
      if (packageJson.config.leo.variations) {
        packageJson.config.leo.variations.forEach(variation => {
          serverlessYml += `\n    - leo:`
          if (variation.cron.time) {
            serverlessYml += `\n        cron: ${variation.cron.time}`
          } else {
            serverlessYml += `\n        queue: ${variation.cron.settings.source || packageJson.config.leo.cron.settings.source}`
          }
          if (variation.name) {
            serverlessYml += `\n        prefix: ${variation.name}`
          }
        })
      }
      if (packageJson.config.leo.uri) {
        serverlessYml += `\n    - http:`
        serverlessYml += `\n        path: ${packageJson.config.leo.uri.replace(/.*:\//, '')}`
        serverlessYml += `\n        method: post`
        serverlessYml += `\n        integration: lambda-proxy`
        serverlessYml += `\n        cors: true`
      }
      serverlessYml += '\n'
    }

    fs.writeFile(packageJsonPath.replace('package.json', 'serverless.yml'), serverlessYml, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err
    })
  })
})
