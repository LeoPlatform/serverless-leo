const findUp = require('find-up')

module.exports = async () => {
  const leoCliConfigAbsPath = await findUp('leo_cli_config.js')
  const leoCliConfig = require(leoCliConfigAbsPath)
  return leoCliConfig.deploy
}
