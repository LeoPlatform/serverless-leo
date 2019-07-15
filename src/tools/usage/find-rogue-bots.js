const {
	getRoqueBots
} = require('../')

async function findRoqueBots () {
	const roqueBots = await getRoqueBots()
	const botIds = roqueBots.map(rb => rb.id)
	console.log(botIds, botIds.length)
}

findRoqueBots()
