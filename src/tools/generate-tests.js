var fs = require('fs')
var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

// generate the tests
// pull in data from the source as a starting point

console.log(packageJson)
