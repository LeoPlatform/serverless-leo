if (!process.env.AWS_REGION && !process.env.AWS_DEFAULT_REGION) {
	console.log('You must select a region. See README.md for details.')
	process.exit()
}
