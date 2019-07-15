const {
	getBotsContaining,
	removeTrigger,
	setCronTime
} = require('../')

async function setBotsCronTriggered () {
	if (process.argv.length < 3) {
		throw new Error('\n' +
      'Arg 0 is required : A string to match against bot names\n'
		)
	}
	const foundBots = await getBotsContaining(process.argv[2], {}, [ 'id', 'triggers', 'time' ])
	const newCronTime = process.argv[3] || '0 * * ? * *'
	await Promise.all(foundBots.map(bot => {
		console.log('Removing Triggers for', bot.id, ': cur time', (bot.time || 'NULL'))
		removeTrigger(bot.id).then(() => {
			console.log('Adding cron time for', bot.id, ': new time', newCronTime)
			return setCronTime(bot.id, newCronTime)
		})
	}))
}

setBotsCronTriggered()
