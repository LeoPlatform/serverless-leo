const {
	getBotsContaining,
	archiveBot
} = require('../')

async function archiveTableChangesBots () {
	const tableChangesBots = await getBotsContaining('dw-replication-table-changes')

	await Promise.all(tableChangesBots.map(domainBot => {
		console.log('Removing checkpoints for ', domainBot.id)
		return archiveBot(domainBot.id)
	}))
}

archiveTableChangesBots()
