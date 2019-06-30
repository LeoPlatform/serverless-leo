const { getEventsForQueue } = require('../')
const aws = require('aws-sdk')
const zlib = require('zlib')
const s3 = new aws.S3()
const { getEidForDate } = require('../../util')

const summary = {
	totalGzipSize: 0,
	totalRecords: 0,
	totalEvents: 0
}

async function getQueueEvents () {
	if (process.argv.length < 4) {
		throw new Error('\n' +
      'Arg 0 is required : A queue name\n' +
      'Arg 2 is required : An eid to start reading\n'
		)
	}
	let queue = process.argv[2]
	let start = process.argv[3]
	let end = process.argv[4] || getEidForDate()
	let iteration = 1
	let result = {}

	do {
		result = await getEventsForQueue(queue, start, end, 2)
		console.log('iteration', iteration)
		aggEvents(result)
		iteration++
		start = result && result.LastEvaluatedKey && result.LastEvaluatedKey.end
	} while (start && result.Count > 0 && iteration < 3)
	console.log(summary)
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

const getS3Data = (item) => {
	var counts = 0
	var size = 0

	// let's figure out where we should jump into this file.
	var fileOffset = null
	var fileEnd = item.gzipSize
	var recordOffset = 0

	for (let i = 0; i < item.offsets.length; i++) {
		var offset = item.offsets[i]

		if (true) {
			counts += offset.records // is this right?
			size += offset.size // this isn't exact when getting in the middle of a file, but close enough
			if (fileOffset == null) {
				fileOffset = offset.gzipOffset
				idOffset += offset.start
			}
			if (counts >= opts.limit || size >= opts.size) {
				fileEnd = offset.gzipOffset + offset.gzipSize - 1
				break
			}
		}
	}

	var file = item.s3
	file.range = `bytes=${fileOffset}-${fileEnd}`
	console.log(file.range)
	var eid = 0
}

getQueueEvents()
