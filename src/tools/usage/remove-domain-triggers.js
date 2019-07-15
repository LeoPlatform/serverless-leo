const {
	getBotsContaining,
	removeTrigger
} = require('../')

async function removeDomainTriggers () {
	const domainBots = await getBotsContaining('domain')

	await Promise.all(domainBots.map(domainBot => {
		console.log('Removing Trigger for ', domainBot.id)
		return removeTrigger(domainBot.id)
	}))
}

removeDomainTriggers()
