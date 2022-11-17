/* eslint-disable space-before-function-paren */
/* eslint-disable no-template-curly-in-string */
const fs = require('fs')
const path = require('path')
const { fetchAll } = require('./utils')

// Try to get serverless 3 version, if that fails try serverless 2 version
// let resolveCfRefValue;
// try {
//   resolveCfRefValue = require('serverless/lib/plugins/aws/utils/resolve-cf-ref-value');
// } catch (err) {
//   resolveCfRefValue = require('serverless/lib/plugins/aws/utils/resolveCfRefValue');
// }
async function resolveCfRefValue(provider, resourceLogicalId, sdkParams = {}) {
  let params = (provider.serverless.service.resources.Parameters || {})
  if (resourceLogicalId in params) {
    return (provider.serverless.service.provider.stackParameters || {})[resourceLogicalId]
  }

  return provider
    .request(
      'CloudFormation',
      'listStackResources',
      Object.assign({ StackName: provider.naming.getStackName() }, sdkParams)
    )
    .then((result) => {
      const targetStackResource = result.StackResourceSummaries.find(
        (stackResource) => stackResource.LogicalResourceId === resourceLogicalId
      )
      if (targetStackResource) return targetStackResource.PhysicalResourceId
      if (result.NextToken) {
        return resolveCfRefValue(provider, resourceLogicalId, { NextToken: result.NextToken })
      }

      throw new Error(
        `Could not resolve Ref with name ${resourceLogicalId}. Are you sure this value matches one resource logical ID ?`,
        'CF_REF_RESOLUTION'
      )
    })
}

let ts
try {
  ts = require('typescript')
} catch (e) {
  // No Typescript
}

const isTS = ts != null

function generateConfig(filePath) {
  let ext = isTS ? '.ts' : '.js'
  let dTSFilePath = filePath.replace(/\..*\.json$/, '.d.ts')
  let configOutputPath = filePath.replace(/\..*\.json$/, ext)
  let projectConfigTxt = fs.existsSync(filePath) && fs.readFileSync(filePath).toString()
  if (!projectConfigTxt) {
    return
  }
  let projectConfig = JSON.parse(projectConfigTxt)
  let buildConfig = projectConfig.configBuilderOptions || {}
  delete projectConfig.configBuilderOptions

  let interfaces = {}
  if (isTS && fs.existsSync(dTSFilePath)) {
    let src = ts.createSourceFile('blah.ts', fs.readFileSync(dTSFilePath).toString(), ts.ScriptTarget.ES2022)

    src.forEachChild(child => {
      if (child.kind === ts.SyntaxKind.InterfaceDeclaration) {
        let o = build(child, projectConfig, [])

        let intf = child
        let flat = {}
        flattenVariables(o, flat, '.', '')
        interfaces[intf.name.escapedText] = flat
      }
    })
  }

  let interfaceName = Object.keys(interfaces)[0]
  let configInterface = interfaces[interfaceName] || {}
  function expandConfig(projectConfig, path) {
    if (projectConfig == null || typeof projectConfig !== 'object') {
      return projectConfig
    }
    let o = {}
    Object.entries(projectConfig).forEach(([key, value]) => {
      let fieldPath = path.concat(key)
      if (typeof value === 'string' && value.match(/^.+?::/)) {
        let [service, key, type, opts] = value.split('::')
        value = {
          is_config_reference: true,
          service,
          key,
          type: (configInterface[fieldPath.join('.')] || {}).type || type || 'dynamic',
          options: opts && inferTypes((opts).split(';').reduce((all, one) => {
            let [key, value] = one.split('=')
            if (key !== '') {
              all[key] = value == null ? true : value
            }
            return all
          }, {}))
        }
      }

      if (
        value != null && typeof value === 'object' &&
        (value.service == null || value.key == null || value.type == null)
      ) {
        if (Array.isArray(value)) {
          value = value.map((a, i) => expandConfig(a, fieldPath.concat(i)))
        } else {
          value = expandConfig(value, fieldPath)
        }
      }
      o[key] = value
    })

    return o
  }

  let eConfig = expandConfig(projectConfig, [])

  let interfaceDef = ''

  let all = (projectConfigTxt.match(/^(\t| )/gm) || []).reduce((s, o) => {
    if (o === '\t') {
      s.tabs++
    } else {
      s.spaces++
    }
    return s
  }, {
    tabs: 0,
    spaces: 0
  })
  let spaces = '\t'
  if (all.spaces > all.tabs) {
    spaces = (projectConfigTxt.match(/^( +)/gm) || ['  '])[0]
  }
  if (interfaceName == null) {
    interfaceName = toProperCase(path.basename(configOutputPath).replace(/\.[tj]s$/, ''))
  }

  let spacesLength = spaces.length

  let imports = new Set()
  let knownTypes = {
    'string': 'string',
    'number': 'number',
    'float': 'number',
    'integer': 'number',
    'int': 'number',
    'dynamic': 'dynamic',
    'unknown': 'unknown'
  }
  function getType(field, depth = '') {
    if (field != null && typeof field === 'object') {
      if (field.service != null && field.key != null && field.type != null) {
        let t = field.type === 'dynamic' ? 'unknown' : field.type

        let collection = 'TYPE'
        let matchParts
        if (matchParts = t.match(/\[\]$/)) {
          t = t.replace(/\[\]$/, '')
          collection = 'TYPE[]'
        } else if (matchParts = t.match(/(Map|Set|Array)<(.*?)>/)) {
          collection = `${matchParts[1]}<TYPE>`
          t = matchParts[2].split(',').map(t => t.trim())
        }
        if (!Array.isArray(t)) {
          t = [t]
        }
        t = t.map(t => {
          if (!knownTypes[t]) {
            if (!t.startsWith('{')) {
              imports.add(t)
            }
          } else {
            t = knownTypes[t]
          }
          return t
        }).join(', ')
        return collection.replace('TYPE', t)
      } else {
        let nextDepth = depth += spaces
        if (Array.isArray(field)) {
          // Get unique set of types in the array
          let r = Array.from(new Set(Object.entries(field).map(([key, value]) => {
            return getType(value, nextDepth)
          })))

          // Join them togethere if there is more than 1
          let rLen = r.length
          r = r.join('|')
          if (rLen > 1) {
            r = `(${r})`
          }

          // return array type
          return `${r}[]`
        } else {
          let r = Object.entries(field).map(([key, value]) => {
            return `${nextDepth}${key}: ${getType(value, nextDepth)};`
          }).join('\n')
          return `{\n${r}\n${depth.substring(0, depth.length - spacesLength)}}`
        }
      }
    } else {
      return typeof field
    }
  }

  interfaceDef = resolveKeywords(
    '${imports}export interface ${interfaceName} ${value}\n',
    {
      interfaceName: interfaceName,
      value: getType(eConfig),
      imports: imports.size ? `import { ${Array.from(imports).join(', ')} } from "types";\n\n` : ''
    }, { spaces: spaces })

  let template = [
    '/* Generated by serverless-leo */',
    isTS
      ? 'import { ConfigurationBuilder } from "leo-sdk/lib/configuration-builder";'
      : 'const { ConfigurationBuilder } = require("leo-sdk/lib/configuration-builder");',
    isTS ? '${interfaceDef}' : '',
    // (isTS ? 'export default' : 'module.exports = ') + ' new ConfigurationBuilder' + (isTS ? '<${interfaceName}>' : '') + '(${config}).build(${buildConfig});'
    (isTS ? 'export default' : 'module.exports = ') + ' new ConfigurationBuilder' + (isTS ? '<${interfaceName}>' : '') + '(process.env.RSF_CONFIG).build(${buildConfig});'
  ].join('\n')

  let fileBody = resolveKeywords(template, {
    interfaceDef: interfaceDef,
    interfaceName: interfaceName,
    config: JSON.stringify(eConfig, (_key, value) => {
      if (value != null && typeof value === 'object' && value.service && value.key && value.type) {
        return `__CLASS_START__new ${toProperCase(value.service)}Resource("${value.key}", "${value.type}"${value.options != null ? (', ' + JSON.stringify(value.options)) : ''}),__CLASS_END__`
      }
      return value
    }, spaces).replace(/"__CLASS_START__(.*?)__CLASS_END__",?/g, (_a, b) => {
      return b.replace(/\\"/g, '"')
    }),
    buildConfig: buildConfig
  }, {
    spaces: spaces
  })

  fs.writeFileSync(configOutputPath, fileBody)

  if (!isTS) {
    fs.writeFileSync(dTSFilePath, [
      `${interfaceDef}`,
      `declare const configuration: ${interfaceName};`,
      `export default configuration;`
    ].join('\n'))
  }

  return eConfig
}

function build(child, projectConfig, path) {
  let o = {};

  (child.members || []).forEach((field) => {
    let type = ts.SyntaxKind[field.type.kind].replace(/Keyword/, '').toLowerCase()
    let name = field.name.escapedText
    let fieldPath = path.concat(name)
    let value = { _isLeaf: true, type, name, path: fieldPath.join('.'), projectConfigValue: projectConfig[name] }

    if (field.type.members != null) {
      value = build(field.type, projectConfig[name], fieldPath)
    }

    o[name] = value
  })

  return o
}

function flattenVariables(obj, out, separator, prefix) {
  prefix = prefix || ''
  separator = separator || ':'
  Object.keys(obj).forEach((k) => {
    var v = obj[k]
    if (typeof v === 'object' && !(Array.isArray(v)) && v !== null && !v._isLeaf) {
      flattenVariables(v, out, separator, prefix + k + separator)
    } else {
      out[prefix + k] = v
    }
  })
}

function toProperCase(text) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').replace(/(^\w|_\w)/g, function (txt) {
    return txt.charAt(txt.length === 1 ? 0 : 1).toUpperCase()
  })
}

function getDataSafe(data = {}, path = '') {
  const pathArray = path.split('.').filter(a => a !== '')
  if (pathArray.length === 0) {
    return data
  }
  const lastField = pathArray.pop()
  return pathArray.reduce((parent, field) => parent[field] || {}, data)[lastField]
}

function resolveKeywords(template, data, opts) {
  const name = template.replace(/\${(.*?)}/g, function (match, field) {
    let value = getDataSafe(data, field.trim())
    if (value != null && typeof value === 'object') {
      value = JSON.stringify(value, null, opts.spaces || 2)
    }
    return value != null ? value : match
  }).replace(/[_-]{2,}/g, '')
  return name
}

const numberRegex = /^\d+(?:\.\d*)?$/
const boolRegex = /^(?:false|true)$/i
const nullRegex = /^null$/
const undefinedRegex = /^undefined$/
const jsonRegex = /^{(.|\n)*}$/

function inferTypes(node) {
  let type = typeof node
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = inferTypes(node[i])
    }
  } else if (type === 'object' && node !== null) {
    Object.keys(node).map(key => {
      node[key] = inferTypes(node[key])
    })
  } else if (type === 'string') {
    if (numberRegex.test(node)) {
      return parseFloat(node)
    } else if (boolRegex.test(node)) {
      return node.toLowerCase() === 'true'
    } else if (nullRegex.test(node)) {
      return null
    } else if (undefinedRegex.test(node)) {
      return undefined
    } else if (jsonRegex.test(node)) {
      return JSON.parse(node)
    }
  }

  return node
}

function getConfigFullPath(serverless, file) {
  if (file) {
    file = path.resolve(process.cwd(), file)
  } else if (serverless.service.custom.leo && serverless.service.custom.leo.configurationPath) {
    file = path.resolve(serverless.serviceDir || serverless.servicePath, serverless.service.custom.leo.configurationPath)
  } else {
    file = path.resolve(process.cwd(), './project-config.def.json')
  }
  return file
}

function getConfigReferences(config, useSecretsManager, lookups = [], permissions = new Set()) {
  let output = {}
  Object.entries(config || {}).forEach(([key, value]) => {
    if (value != null && typeof value === 'object' &&
      value.service != null && value.key != null && value.type != null) {
      value.key = value.key.replace(/\$\{region\}/gi, '${AWS::Region}')
      let v
      switch (value.service) {
        case 'cf': v = {
          'Fn::ImportValue': {
            'Fn::Sub': value.key
          }
        }; break
        case 'cfr': v = {
          'Ref': value.key.replace(/\./g, '').replace(/\$\{.*?\}/g, '')
        }; break
        case 'ssm': v = { 'Fn::Sub': `{{resolve:ssm:${value.key}}}` }; break
        case 'secret':
          if ((value.options && value.options.resolve === 'runtime')) {
            v = { 'Fn::Sub': `secret::${value.key}::${value.type}` }
            let secretKey = value.key.split('.')[0]
            permissions.add(`arn:aws:secretsmanager:*:\$\{AWS::AccountId\}:secret:${secretKey}-*`)
          } else {
            let parts = value.key.split('.')
            parts = [parts[0], 'SecretString'].concat(parts.splice(1).join('.'))
            v = { 'Fn::Sub': `{{resolve:secretsmanager:${parts.join(':')}}}` }
          }
          break
        case 'stack': v = {
          'Ref': value.key
        }; break
      }
      output[key] = `\${RSF${lookups.length}}`
      lookups.push(v)
    } else if (value != null && Array.isArray(value)) {
      let r = value.map(v => {
        if (v == null || typeof (v) !== 'object') {
          return v
        }
        return getConfigReferences(v, useSecretsManager, lookups, permissions).output
      })
      output[key] = r
    } else if (value != null && typeof value === 'object') {
      let r = getConfigReferences(value, useSecretsManager, lookups, permissions)
      output[key] = r.output
    } else {
      output[key] = value
    }
  })

  return {
    output,
    lookups: lookups.reduce((all, one, index) => {
      all[`RSF${index}`] = one
      return all
    }, {}),
    permissions
  }
}

async function resolveConfigForLocal(serverless, cache = {}) {
  let fullStage = `${serverless.providers.aws.getRegion()}-${serverless.service.provider.environment.RSF_INVOKE_STAGE}`
  let configFromCache = false
  let serviceDir = serverless.config.serviceDir || serverless.config.servicePath
  let configFileCache = path.resolve(serviceDir, `.rsf/config-${fullStage}.json`)
  if (fs.existsSync(configFileCache)) {
    let stat = fs.statSync(configFileCache)
    let duration = Math.floor((Date.now() - stat.mtimeMs) / 1000)

    // Default cache duration is 30 min
    let validCacheDuration = (+process.env.RSF_CACHE_SECONDS) || 1800
    if (duration < validCacheDuration) {
      try {
        serverless.service.provider.environment.RSF_CONFIG = JSON.stringify(module.require(configFileCache))
        configFromCache = true
      } catch (e) {
        // Error getting cache
      }
    }
  }

  cache = {
    stack: {},
    cf: {},
    sm: {},
    ssm: {},
    cfr: {},
    ...cache
  }

  // Resolve config env var
  let rsfConfigEnvTemplate = serverless.service.provider.environment && serverless.service.provider.environment.RSF_CONFIG
  if (!configFromCache && rsfConfigEnvTemplate) {
    let v = await resolveFnSub(rsfConfigEnvTemplate, serverless, cache)
    serverless.service.provider.environment.RSF_CONFIG = v
  }

  let busConfigFromCache = false
  let busConfigFileCache = path.resolve(serviceDir, `.rsf/bus-config-${fullStage}.json`)
  if (fs.existsSync(busConfigFileCache)) {
    let stat = fs.statSync(busConfigFileCache)
    let duration = Math.floor((Date.now() - stat.mtimeMs) / 1000)

    // Default cache duration is 30 min
    let validCacheDuration = (+process.env.RSF_CACHE_SECONDS) || 1800
    if (duration < validCacheDuration) {
      try {
        serverless.service.provider.environment.RSTREAMS_CONFIG = JSON.stringify(module.require(busConfigFileCache))
        busConfigFromCache = true
      } catch (e) {
        // Error getting cache
      }
    }
  }

  // Resolve bus env config if it exists
  let rstreamsConfigEnvTemplate = serverless.service.provider.environment && serverless.service.provider.environment.RSTREAMS_CONFIG
  if (!busConfigFromCache && rstreamsConfigEnvTemplate) {
    let v = await resolveFnSub(rstreamsConfigEnvTemplate, serverless, cache)
    serverless.service.provider.environment.RSTREAMS_CONFIG = v
    fs.mkdirSync(path.dirname(busConfigFileCache), { recursive: true })
    fs.writeFileSync(busConfigFileCache, JSON.stringify(JSON.parse(v), null, 2))
  }

  // Resolve bus env secret if it exists
  let rstreamsConfigEnvSecretTemplate = serverless.service.provider.environment && serverless.service.provider.environment.RSTREAMS_CONFIG_SECRET
  if (rstreamsConfigEnvSecretTemplate) {
    let v = await resolveFnSub(rstreamsConfigEnvSecretTemplate, serverless, cache)
    serverless.service.provider.environment.RSTREAMS_CONFIG_SECRET = v
  }
}

const resolveServices = {
  secretsmanager: async (provider, key, cache) => {
    let parts = key.split(':')
    let id = parts.shift()
    let last = parts.pop()
    let value
    if (id in cache.sm) {
      value = cache.sm[id]
    } else {
      value = await provider.request('SecretsManager', 'getSecretValue', { SecretId: id })
      cache.sm[id] = value
    }

    return parts.reduce((o, k) => {
      let v = o[k] || {}
      if (typeof v === 'string') {
        v = JSON.parse(v)
      }
      return v
    }, value)[last]
  },
  ssm: async (provider, key, cache) => {
    if (key in cache.ssm) {
      return cache.ssm[key]
    } else {
      let value = await provider.request('SSM', 'getParameter', { Name: key })
      cache.ssm[key] = value.Parameter.Value
      return value.Parameter.Value
    }
  },
  cf: async (provider, key, cache) => {
    if (Object.keys(cache.cf).length === 0) {
      let allCfExports = await fetchAll(t => provider.request('CloudFormation', 'listExports', { NextToken: t }))
      allCfExports.Exports.forEach(v => {
        cache.cf[v.Name] = v.Value
      })
    }
    return cache.cf[key]
  },
  cfr: async (provider, key, cache) => {
    if (!(key in cache.cfr)) {
      let [stack, resource] = key.split('.')
      cache.cfr[key] = await resolveCfRefValue(provider, resource, { StackName: stack })
    }
    return cache.cfr[key]
  },
  stack: async (provider, key, cache) => {
    if (!(key in cache.stack)) {
      cache.stack[key] = await resolveCfRefValue(provider, key)
    }
    return cache.stack[key]
  }
}

async function resolveFnSub(fnSub, serverless, cache) {
  let lookups = {
    ...(serverless.service.provider.stackParameters || []).reduce((all, one) => {
      if (one != null) {
        let paramDef = (serverless.service.resources.Parameters || {})[one.ParameterKey]
        if (paramDef && paramDef.Type.match(/AWS::SSM::Parameter/)) {
          all[one.ParameterKey] = `{{resolve:ssm:${one.ParameterValue}}}`
        } else {
          all[one.ParameterKey] = one.ParameterValue
        }
      }
      return all
    }, {}),
    ...serverless.service.resources.Resources
  }
  if (fnSub != null && typeof fnSub === 'object' && fnSub['Fn::Sub']) {
    fnSub = fnSub['Fn::Sub']
  }

  let template = fnSub
  if (Array.isArray(fnSub)) {
    let [t, l] = fnSub
    template = t
    lookups = l
  }
  Object.entries({
    'AWS::Region': serverless.providers.aws.getRegion(),
    'AWS::StackName': serverless.providers.aws.naming.getStackName()
  }).forEach(([key, value]) => {
    lookups[key] = value
  })
  let entries = Object.entries(lookups)
  for (let i = 0; i < entries.length; i++) {
    let [key, value] = entries[i]
    if (value != null && typeof value === 'object' && value['Fn::Sub']) {
      value = await resolveFnSub(value['Fn::Sub'], serverless, cache)
    }
    if (value != null && typeof value === 'object') {
      if (value.Ref) {
        let preValue = value.Ref
        value = await resolveServices.stack(serverless.providers.aws, preValue, cache)
      } else if (value['Fn::ImportValue']) {
        let preValue = await resolveFnSub(value['Fn::ImportValue'], serverless, cache)
        value = await resolveServices.cf(serverless.providers.aws, preValue, cache)
      }
    } else if (typeof value === 'string') {
      let [, service, key] = (value.match(/{{resolve:(secretsmanager|ssm):(.*)}}$/) || [])
      if (service && resolveServices[service]) {
        value = await resolveServices[service](serverless.providers.aws, key, cache)
      }
    }
    lookups[key] = value
  }

  return template.replace(/\${(.*?)}/g, (_, key) => {
    let v = lookups[key]
    if (typeof v !== 'string') {
      v = JSON.stringify(v)
    }
    return v
  })
}

function getConfigEnv(serverless, file, config) {
  const stage = serverless.service.provider.stage
  const custom = serverless.service.custom[stage] ? serverless.service.custom[stage] : serverless.service.custom
  const leoStack = custom.leoStack || serverless.service.custom.leoStack
  const useSecretsManager = ((serverless.service.custom || {}).leo || {}).rsfConfigType === 'secretsmanager'

  let { output, lookups, permissions } = getConfigReferences(config, useSecretsManager)
  let hasConfig = Object.keys(output || {}).length > 0
  let params = {};
  // Find Stack Parameters
  (JSON.stringify(lookups).match(/\$\{(.*?)\}/g) || []).forEach((a) => {
    let key = a.replace(/^\$\{(.*)\}$/, '$1')
    if (!(key in params)) {
      let value = serverless.pluginManager.cliOptions[key]

      if (value == null) {
        if (key.match(/^stage$/i)) {
          value = serverless.service.provider.stage

          // Proper Case if needed
          if (key[0] === key[0].toUpperCase()) {
            value = toProperCase(value)
          }
        } else if (key.match(/^AWS::.*$/i)) {
          // AWS var
          return
        } else if ((serverless.service.resources.Resources && serverless.service.resources.Resources[key]) || (serverless.service.resources.Parameters && serverless.service.resources.Parameters[key])) {
          // Stack var
          return
        }
      }

      params[key] = {
        Type: 'String',
        MinLength: 1,
        Description: key,
        Value: value
      }
    }
  })

  // Add permissions to lambda roles to read secrets
  const allFunctions = serverless.service.getAllFunctions()
  const roles = Object.keys(allFunctions.reduce((roles, functName) => {
    roles[serverless.service.getFunction(functName).role] = true
    return roles
  }, {}))

  let secretsPermissions = [].concat(Array.from(permissions).map(p => ({ 'Fn::Sub': p })))
  if (useSecretsManager) {
    secretsPermissions = secretsPermissions.concat({
      'Fn::Sub': 'arn:aws:secretsmanager:*:${AWS::AccountId}:secret:rsf-config-${AWS::StackName}-${AWS::Region}-*'
    }, {
      'Fn::Sub': `arn:aws:secretsmanager:\${AWS::Region}:\${AWS::AccountId}:secret:rstreams-${leoStack}-*`
    })
  }

  roles.forEach(roleName => {
    let role = serverless.service.resources.Resources[roleName]

    if (role) {
      role.Properties.ManagedPolicyArns = (role.Properties.ManagedPolicyArns || []).concat({
        'Fn::ImportValue': {
          'Fn::Sub': `${leoStack}-Policy`
        }
      })
      if (secretsPermissions.length > 0) {
        role.Properties.Policies = (role.Properties.Policies || []).concat({
          PolicyName: 'RSFSecretAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'secretsmanager:GetSecretValue',
                Resource: secretsPermissions
              }
            ]
          }
        })
      }
    }
  })

  let rsfConfigName = {
    'Fn::Sub': 'rsf-config-${AWS::StackName}-${AWS::Region}'
  }

  if (useSecretsManager) {
    // Build default replica regions
    let map = {
      RSFReplicaMap: Object.entries({
        'us-east-2': ['us-east-1'],
        'us-east-1': ['us-west-2'],
        'us-west-1': ['us-east-1'],
        'us-west-2': ['us-east-1'],
        'af-south-1': ['us-east-1'],
        'ap-east-1': ['ap-south-1'],
        'ap-south-1': ['ap-east-1'],
        'ap-northeast-3': ['ap-east-1'],
        'ap-northeast-2': ['ap-east-1'],
        'ap-southeast-1': ['ap-east-1'],
        'ap-southeast-2': ['ap-east-1'],
        'ap-northeast-1': ['ap-east-1'],
        'ca-central-1': ['us-east-1'],
        'eu-central-1': ['eu-west-1'],
        'eu-west-1': ['eu-central-1'],
        'eu-west-2': ['eu-central-1'],
        'eu-south-1': ['eu-central-1'],
        'eu-west-3': ['eu-central-1'],
        'eu-north-1': ['eu-central-1'],
        'me-south-1': ['us-east-1'],
        'sa-east-1': ['us-east-1']
      }).reduce((a, [key, values]) => {
        if (serverless.service.custom.leo.rsfConfigReplicationRegions &&
          serverless.service.custom.leo.rsfConfigReplicationRegions[key]) {
          values = serverless.service.custom.leo.rsfConfigReplicationRegions[key]
          if (!Array.isArray(values)) {
            values = [values]
          }
        }
        a[key] = {
          values: values.map(region => ({
            Region: region
          }))
        }
        return a
      }, {})
    }
    serverless.service.resources.Mappings = Object.assign(map, serverless.service.resources.Mappings)
  }

  return {
    env: Object.assign(hasConfig ? {
      RSF_CONFIG: useSecretsManager ? rsfConfigName : {
        'Fn::Sub': [
          JSON.stringify(output), lookups
        ]
      }
    } : {}, useSecretsManager ? {
      // Add RStreams config resource
      RSTREAMS_CONFIG_SECRET: {
        'Fn::Sub': `rstreams-${leoStack}`
      }
    } : {
      RSTREAMS_CONFIG: {
        'Fn::Sub': [JSON.stringify({
          'region': '${Region}',
          'kinesis': '${LeoKinesisStream}',
          's3': '${LeoS3}',
          'firehose': '${LeoFirehoseStream}',
          'resources': {
            'LeoStream': '${LeoStream}',
            'LeoCron': '${LeoCron}',
            'LeoEvent': '${LeoEvent}',
            'LeoSettings': '${LeoSettings}',
            'LeoSystem': '${LeoSystem}',
            'LeoS3': '${LeoS3}',
            'LeoKinesisStream': '${LeoKinesisStream}',
            'LeoFirehoseStream': '${LeoFirehoseStream}',
            'Region': '${Region}'
          }
        }), {
          'LeoStream': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoStream`
            }
          },
          'LeoCron': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoCron`
            }
          },
          'LeoEvent': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoEvent`
            }
          },
          'LeoSettings': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoSettings`
            }
          },
          'LeoSystem': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoSystem`
            }
          },
          'LeoS3': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoS3`
            }
          },
          'LeoKinesisStream': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoKinesisStream`
            }
          },
          'LeoFirehoseStream': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-LeoFirehoseStream`
            }
          },
          'Region': {
            'Fn::ImportValue': {
              'Fn::Sub': `${leoStack}-Region`
            }
          }
        }]
      }
    }),

    params: params,
    resources: (hasConfig && useSecretsManager) ? {
      RSFConfig: {
        Type: 'AWS::SecretsManager::Secret',
        Properties: {
          Description: {
            'Fn::Sub': 'Secrets for Serverless Stack ${AWS::StackName} in ${AWS::Region}'
          },
          Name: rsfConfigName,
          SecretString: {
            'Fn::Sub': [
              JSON.stringify(output, null, 2), lookups
            ]
          },
          ReplicaRegions: { 'Fn::FindInMap': ['RSFReplicaMap', { 'Ref': 'AWS::Region' }, 'values'] },
          Tags: [{
            Key: 'service',
            Value: serverless.service.service
          }]
        }
      }
    } : {}
  }
}

function populateEnvFromConfig(serverless, file, config) {
  let { params, env, resources } = getConfigEnv(serverless, file, config)
  if (env) {
    serverless.service.provider.environment = Object.assign(env, serverless.service.provider.environment)
  }
  if (resources) {
    serverless.service.resources.Resources = Object.assign(resources, serverless.service.resources.Resources)
  }
  if (params) {
    serverless.service.provider.stackParameters = []
      .concat(serverless.service.provider.stackParameters)
      .concat(Object.entries(params)
        .filter(([, value]) => value.Value != null)
        .map(([key, value]) => {
          return {
            ParameterKey: key,
            ParameterValue: value.Value
          }
        }))
    serverless.service.resources.Parameters = Object.assign(
      Object.entries(params).reduce((all, [key, value]) => {
        let v = {
          ...value
        }
        delete v.Value
        all[key] = v
        return all
      }, {}), serverless.service.resources.Parameters)
  }
}

module.exports = {
  generateConfig,
  getConfigFullPath,
  getConfigEnv,
  populateEnvFromConfig,
  resolveConfigForLocal
}
