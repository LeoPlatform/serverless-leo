const {
	getStatsForBot
} = require('../')

async function getBotStats () {
	const botStats = await getStatsForBot('dw-domain-ar-allocation-var-entrata44', (x, stats) => {
		console.log(stats)
	})

	// const botIds = botStats.map(rb => rb.id)
	// console.log(botIds, botIds.length)
}

getBotStats()
