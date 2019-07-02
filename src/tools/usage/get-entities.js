const { getEntitiesForQueue } = require('../')

const summary = {
	totalGzipSize: 0,
	totalRecords: 0,
	totalEvents: 0
}

async function getEntities () {
	if (process.argv.length < 3) {
		throw new Error('\n' +
			'Arg 0 is required : A queue name\n'
		)
	}
	let queue = process.argv[2]
	let iteration = 0
	let nextStart = null
	let result = null
	do {
		iteration++
		result = await getEntitiesForQueue(queue, nextStart, 2)
		nextStart = result && result.LastEvaluatedKey
		if (iteration % 10 === 0) console.log('iteration', iteration)
	} while (nextStart && result.Count === 0 && iteration < 100)

	console.log('result', result)
}

const aggEvents = (result) => {
	console.log('---------------------------------------------------------------')
	console.log({
		Items: '...see below...',
		Count: result.Count,
		ScannedCount: result.ScannedCount,
		LastEvaluatedKey: result.LastEvaluatedKey
	})
	result.Items.forEach(i => {
		console.log('ITEM')
		console.log(i)
		let req = {Bucket: i.s3.bucket, Key: i.s3.key}
		s3.getObject(req, (err, data) => {
			if (err) console.log('error', err)
			console.log('S3 DATA:', data)
			zlib.unzip(data.Body, (inferr, infdata) => {
				console.log(`INFLATED (size: ${infdata.toString().length})`)
				console.log(infdata.toString())
			})
		})
	})

	result.Items.forEach(e => {
		summary.totalGzipSize += e.gzipSize
		summary.totalRecords += e.records
		summary.totalEvents++
	})
}

getEntities()
