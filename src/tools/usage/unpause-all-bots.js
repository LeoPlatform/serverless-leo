const {
	getBotsContaining,
	pauseBot
} = require('../')

async function unpauseAllBots () {
	const allBots = await getBotsContaining()
	await Promise.all(allBots.map(aBot => {
		return pauseBot(aBot.id, false)
	}))
}

unpauseAllBots()
