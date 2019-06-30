
require('./env-check')

module.exports = {
	// dev
	/*
	tables: {
		bot: 'dev-bus-LeoCron-7GL7C0C2IKSA',
		stats: 'leo-ui-LeoStats-11PJHBHQNQ2GL',
		settings: 'dev-bus-LeoSettings-1N3A6RGNI19O',
		events: 'dev-bus-LeoStream-T2DBJK5WRCIA',
		entities: 'dw-work-domain-Entities-Y3GU7OHLKW21'
	} */
	// prod
	tables: {
		bot: 'LeoBus-LeoCron-1JQ944LENAQ91',
		stats: 'botman-LeoStats-12HGYNRZW9NNQ',
		settings: 'LeoBus-LeoSettings-1CHR16BH1ND45',
		events: 'dLeoBus-LeoStream-19O7284EX67W1',
		entities: 'dw-streams-domain-Entities-Q4WM6CSE1XQV'
	}
}
