const {
	getBot,
	forceRunBot
} = require('../')

const botId = process.argv[2]

async function forceRunRogueBots () {
	if (!botId) return console.log('Supply a bot name.')
	const bot = await getBot(botId)
	if (!bot) return console.log('Invalid bot name.')
	console.log(bot)
	forceRunBot(botId)
}

forceRunRogueBots()
