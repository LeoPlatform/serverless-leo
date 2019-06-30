const findVariationBaseNames = require('./find-variation-base-names')
const getVariations = require('./get-variations')
const updateBotTemplateName = require('./update-template-bot')
const addLambdaTemplate = require('./add-lambda-template')
const forceRunBot = require('./force-run-bot')
const getBotsContaining = require('./get-bots-containing')
const getBot = require('./get-bot')
const getSetting = require('./get-setting')
const getRoqueBots = require('./get-rogue-bots')
const removeTrigger = require('./remove-trigger')
const removeCheckpoints = require('./remove-checkpoints')
const archiveBot = require('./archive-bot')
const pauseBot = require('./pause-bot')
const purgeInstanceLogs = require('./purge-instance-logs')
const getStatsForBot = require('./get-stats-for-bot')
const removeStatsForBot = require('./remove-stats')
const getEventsForQueue = require('./get-events-for-queue')
const setBotCheckpoint = require('./set-bot-checkpoint')
const setCronTime = require('./set-cron-time')
const getEntitiesForQueue = require('./get-entities-for-queue')

function Tools (toolsConfig) {
  this.config = toolsConfig
  Object.assign(this, {
    getBot,
    getSetting,
    findVariationBaseNames,
    getVariations,
    updateBotTemplateName,
    addLambdaTemplate,
    forceRunBot,
    getBotsContaining,
    getRoqueBots,
    removeTrigger,
    removeCheckpoints,
    archiveBot,
    pauseBot,
    purgeInstanceLogs,
    getStatsForBot,
    removeStatsForBot,
    getEventsForQueue,
    setBotCheckpoint,
    setCronTime,
    getEntitiesForQueue
  })
}

module.exports = Tools
