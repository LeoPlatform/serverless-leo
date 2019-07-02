const {
	getBotsContaining,
	pauseBot
} = require('../')

async function pauseAllBots () {
	const allBots = await getBotsContaining()
	await Promise.all(allBots.map(aBot => {
		return pauseBot(aBot.id)
	}))
}

pauseAllBots()
