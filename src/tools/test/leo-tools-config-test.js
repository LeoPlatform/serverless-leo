const config = require('../leo-tools-config')
// override config for tests
config.tables = {
	bot: 'test-LeoCron',
	stats: 'test-LeoStats',
	settings: 'test-LeoSettings'
}
