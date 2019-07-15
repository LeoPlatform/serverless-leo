const {
	getRoqueBots,
	forceRunBot
} = require('../')

async function forceRunRogueBots () {
	const rogueBots = await getRoqueBots()
	await Promise.all(rogueBots.map(rogueBot => {
		return forceRunBot(rogueBot.id)
	}))
}

forceRunRogueBots()
