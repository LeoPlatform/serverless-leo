const {
	getBotsContaining,
	setBotCheckpoint
} = require('../')

async function setBotCheckpoints () {
	if (process.argv.length < 4) {
		throw new Error('\n' +
			'Arg 0 is required : A string to match against bot names\n' +
			'Arg 1 is required : An eid to set as each bot\'s read checkpoint\n'
		)
	}
	const allBots = await getBotsContaining(process.argv[2], {}, [ 'id', 'checkpoints' ])
	await Promise.all(allBots.map(aBot => {
		let readKey = Object.keys(aBot.checkpoints.read)[0]
		console.log(aBot.id)
		console.log(' read key:', readKey, ', cur checkpoint:', (typeof aBot.checkpoints.read[readKey] !== 'undefined' ? aBot.checkpoints.read[readKey].checkpoint : 'undefined'))
		setBotCheckpoint(aBot.id, Object.keys(aBot.checkpoints.read)[0], process.argv[3])
	}))
}

setBotCheckpoints()
