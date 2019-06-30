const {
	getBotsContaining,
	forceRunBot
} = require('../')

async function setBotCheckpoints () {
	if (process.argv.length < 3) {
		throw new Error('\n' +
			'Arg 0 is required : A string to match against bot names\n'
		)
	}
	const allBots = await getBotsContaining(process.argv[2], {}, [ 'id', 'checkpoints' ])
	await Promise.all(allBots.map(aBot => {
		console.log(aBot.id)
		forceRunBot(aBot.id)
	}))
}

setBotCheckpoints()
