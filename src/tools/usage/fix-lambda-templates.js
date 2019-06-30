const {
	findVariationBaseNames,
	getVariations,
	updateBotTemplateName,
	addLambdaTemplate
} = require('../')

async function fixLambdaTemplates () {
	const variationBaseNames = await findVariationBaseNames()
	await Promise.all(variationBaseNames.map(variationBaseName => {
		// console.log('VARIATIONBASENAME', variationBaseName)
		return getVariations(variationBaseName).then(variations => {
			// console.log('VARIATIONS', variations)
			return Promise.all(variations.map(variation => {
				if (!variation.lambdaName) {
					console.log('BAD VARIATION. Archive bot?', variation)
					return Promise.resolve()
				}
				return Promise.all([
					// set variationBaseName as the template
					updateBotTemplateName(variation.id, variationBaseName).catch(e => console.log('UPDATE BOT TEMPLATE NAME FAILED')),
					// set lambdaTemplate as the variationBaseName
					addLambdaTemplate(variation.lambdaName, variationBaseName).catch(e => {
						console.log('addLambdaTemplate lambdaName:', variation.lambdaName)
						console.log('addLambdaTemplate variationBaseName:', variationBaseName)
						console.log('ADD TEMPLATE FAILED. Most likely you should add a record to LeoSettings table for id=lambda_templates value=<empty map>')
					})
				])
			}))
		}, console.log)
	}))
}

fixLambdaTemplates()
