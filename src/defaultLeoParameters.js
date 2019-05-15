/* eslint-disable no-template-curly-in-string */
const findUp = require('find-up')

module.exports = async (serverless) => {
  const leoCliConfigAbsPath = await findUp('leo_cli_config.js')
  const leoCliConfig = require(leoCliConfigAbsPath)

  const defaultParameters = leoCliConfig.linkedStacks.reduce((params, stack) => {
    params[stack] = {
      'Type': 'String',
      'Description': 'Reference to the "' + stack + '" stack'
    }
    return params
  }, {
    'Environment': {
      'Type': 'String',
      'Default': "${{opt:stage, 'test'}}",
      'MinLength': 1,
      'Description': 'Environment'
    }
  })

  const deploymentEnvironment = Object.keys(leoCliConfig.deploy).shift()
  const parameters = Object.keys(leoCliConfig.deploy[deploymentEnvironment].parameters)
  parameters.forEach(param => {
    if (!defaultParameters[param]) defaultParameters[param] = {}
    defaultParameters[param].Default = "${{self:custom.leoDeployParams.${{opt:stage, 'test'}}.parameters." + param + '}}'
  })
  return { 'Parameters': defaultParameters }
}
