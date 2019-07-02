const {
	getBotsContaining,
	removeCheckpoints
} = require('../')

async function disconnectTableChanges () {
	const tableChangesBots = await getBotsContaining('dw-replication-table-changes')

	await Promise.all(tableChangesBots.map(domainBot => {
		console.log('Removing checkpoints for ', domainBot.id)
		return removeCheckpoints(domainBot.id)
	}))
}

disconnectTableChanges()
