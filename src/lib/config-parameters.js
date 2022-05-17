const fs = require("fs");
const path = require("path");

const regions = [
	'us-east-2',
	'us-east-1',
	'us-west-1',
	'us-west-2',
	'af-south-1',
	'ap-east-1',
	'ap-south-1',
	'ap-northeast-3',
	'ap-northeast-2',
	'ap-southeast-1',
	'ap-southeast-2',
	'ap-northeast-1',
	'ca-central-1',
	'eu-central-1',
	'eu-west-1',
	'eu-west-2',
	'eu-south-1',
	'eu-west-3',
	'eu-north-1',
	'me-south-1',
	'sa-east-1',
];

const regionRegex = new RegExp(`(${regions.join("|")})`, "g");
// const stageRegex = /(dev|test|staging|stage|production|prod)/ig;

function tokenize(service, value, extra, stageRegex) {
	let tokens = {
		stage: [],
		region: []
	};
	let { Description: desc, Tags: tags } = extra || {};
	let rsfTokenTag = (tags || []).find(t => t.Key === "rsf:token");
	let tokenizedValue;
	//let type;
	if (rsfTokenTag) {
		tokenizedValue = rsfTokenTag.Value.replace(/__(.*?)__/g, (all, capture) => {
			return `\${${capture}}`;
		});
	} else {
		let tokenMatches = desc && desc.match(/rsf-token:(.*?):rsf-token/);
		if (tokenMatches) {
			tokenizedValue = tokenMatches[1];
			// let typeMatches = desc.match(/rsf-type:(.*?)[ $]/g);
			// if (typeMatches) {
			// 	type = typeMatches[1];
			// }
		} else {
			tokenizedValue = value.replace(stageRegex, (str, args) => {
				const stage = str[0] === str[0].toUpperCase() ? "Stage" : "stage";
				tokens.stage.push(str);
				return `\${${stage}}`
			}).replace(regionRegex, (str) => {
				tokens.region.push(str);
				return '${region}'
			})
		}
	}
	if (!tokenizedValue.startsWith(service + "::")) {
		tokenizedValue = `${service}::${tokenizedValue}`
	}
	// if (type != null && !tokenizedValue.contains(":" + type)) {
	// 	tokenizedValue = `${tokenizedValue}::${type}`
	// }

	let [_service, tokenizedKey, type, opts] = tokenizedValue.split("::")
	let options = (opts || "").split(';').reduce((all, one) => {
		let [key, value] = one.split('=');
		if (key !== '') {
			all[key] = value == null ? true : value;
		}
		return all;
	}, {});

	let name = options.name;
	delete options.name;

	let optsStr = Object.entries(options).reduce((all, [key, value]) => {
		return all.concat(`${key}=${value}`)
	}, []).join(";");

	tokenizedValue = [service, tokenizedKey, type, optsStr].filter(a => a).join("::");

	if (name == null) {
		name = tokenizedKey
	}

	name = name.replace(new RegExp(`^${service}::`), "")
		.replace(/(\${.*?})/g, "")
		.replace(/[-_ //\\\\.]+/g, "_")
		.replace(/(^_|_$)/g, "")
	name = name[0].toLowerCase() + name.slice(1);

	return {
		service: service,
		value: value,
		tokenizedValue: tokenizedValue,
		tokens: tokens,
		tags: tags || [],
		desc: desc || "",
		name: name
	}
}

function mergeTokens(all, token) {
	let key = token.tokenizedValue;
	if (!(key in all)) {
		// let [_service, tokenizedKey, _type, opts] = token.tokenizedValue.split("::")
		// let options = (opts || "").split(';').reduce((all, one) => {
		// 	let [key, value] = one.split('=');
		// 	if (key !== '') {
		// 		all[key] = value == null ? true : value;
		// 	}
		// 	return all;
		// }, {});

		// let name = options.name;
		// if (name == null) {
		// 	name = tokenizedKey
		// 		.replace(new RegExp(`^${token.service}::`), "")
		// 		.replace(/(\${.*?})/g, "")
		// 		.replace(/[-_ //\\\\.]+/g, "_")
		// 		.replace(/(^_|_$)/g, "")
		// 	name = name[0].toLowerCase() + name.slice(1)
		// 	//name = snakeCase(token.tokenizedValue);
		// }
		all[key] = {
			service: token.service,
			tokenizedValue: token.tokenizedValue,
			tokens: {},
			values: [],
			name: token.name,
			tags: [],
			desc: []
		};
	}
	let entry = all[key];

	const tokens = entry.tokens;
	entry.values = entry.values.concat(token.value);
	if (token.desc) {
		entry.desc = entry.desc.concat(token.desc);
	}
	if (token.tags) {
		entry.tags = entry.tags.concat(token.tags);
	}
	Object.entries(token.tokens || {}).forEach(([key, value]) => {
		const existing = tokens[key] || [];
		tokens[key] = existing.concat(value);
	});


	return all;
}


let aws = require("aws-sdk");
let prompt = require('prompt-sync')({ sigint: true })

async function fetchAll(fn) {
	let response = {};
	do {
		let r = await fn(response && response.NextToken);

		delete response.NextToken;
		Object.entries(r).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				response[key] = (response[key] || []).concat(value);
			} else {
				response[key] = value
			}
		})
	} while (response.NextToken)
	return response;
}

async function editConfig(serverless, configPath, region) {

	let configDef = {};
	if (fs.existsSync(configPath)) {
		configDef = require(configPath)
	}

	let allTokenized;
	let awsResourcesCachePath = path.resolve(serverless.serviceDir, `.rsf/resource-cache.json`)


	if (fs.existsSync(awsResourcesCachePath)) {
		let stat = fs.statSync(awsResourcesCachePath);
		let duration = Math.floor((Date.now() - stat.mtimeMs) / 1000);
		let validCacheDuration = (+process.env.RSF_CACHE_SECONDS) || 1800;
		if (duration < validCacheDuration) {
			try {
				allTokenized = require(awsResourcesCachePath);
			} catch (e) {
				// Error getting cache
			}
		}
	}
	if (allTokenized == null) {

		if (region == null) {
			region = prompt("Region: [us-east-1] ") || "us-east-1";
		}

		let ssmClient = new aws.SSM({
			region: region
		});
		let secretsClient = new aws.SecretsManager({
			region: region
		});
		let cfClient = new aws.CloudFormation({
			region: region
		});

		let [ssm, secrets, cfexports, rsfGlobalConfig] = await Promise.all([
			fetchAll(t => ssmClient.describeParameters({ NextToken: t, MaxResults: 50 }).promise()),
			fetchAll(t => secretsClient.listSecrets({ NextToken: t, MaxResults: 100 }).promise()),
			fetchAll(t => cfClient.listExports({ NextToken: t }).promise()),
			ssmClient.getParameter({ Name: "/rsf/global/config" }).promise().catch(() => { return { Parameter: { Type: "String", Value: "{}" } } })
		]);

		if (rsfGlobalConfig.Parameter.Type == "StringList") {
			rsfGlobalConfig = {
				stages: rsfGlobalConfig.Parameter.Value.split(",")
			}
		} else if (rsfGlobalConfig.Parameter.Type == "String") {
			rsfGlobalConfig = JSON.parse(rsfGlobalConfig.Parameter.Value);
		} else {
			rsfGlobalConfig = {}
		}

		rsfGlobalConfig = {
			stages: ["dev", "test", "stage", "staging", "production", "prod"],
			...rsfGlobalConfig
		};

		let rsfStages = Array.from(new Set([].concat(rsfGlobalConfig.stages || []).concat(serverless.service.custom.leo.rsfConfigStages || [])));

		const stageRegex = new RegExp(`(${rsfStages.join("|")})`, "ig");

		let ssmTokenized = ssm.Parameters.map(v => {
			return tokenize("ssm", v.Name, v, stageRegex)
		}).reduce(mergeTokens, {})

		let secretsTokenized = secrets.SecretList.map(v => {
			return tokenize("secrets", v.Name, v, stageRegex)
		}).reduce(mergeTokens, {})

		let cfTokenized = cfexports.Exports.map(v => {
			return tokenize("cf", v.Name, v, stageRegex)
		}).reduce(mergeTokens, {})

		allTokenized = {
			...ssmTokenized,
			...secretsTokenized,
			...cfTokenized
		}
		fs.mkdirSync(path.dirname(awsResourcesCachePath), { recursive: true });
		fs.writeFileSync(awsResourcesCachePath, JSON.stringify(allTokenized, null, 2));
	}

	function search(value) {
		if (!value) {
			value = prompt("Enter a search value: ");
		}
		const values = value.split(/ +/).map(v => new RegExp(v, "i"));
		return Object.values(allTokenized).filter(data => {
			return values.every(value => data.name.match(value) || data.desc.some(d => d.match(value) || data.tags.some(t => t.Value.match(value))))
		}).sort((a, b) => a.name.localeCompare(b.name));
	}

	function printSearch(matches) {

		if (matches.length) {
			matches.forEach((m, i) => {
				console.log(`${i + 1}) ${m.name} (${m.service.toUpperCase()})`);
			})
		} else {
			console.log("No matches!")
		}
	}
	let cmd;
	let lastSearch;
	const exitCommand = "done";
	do {
		cmd = prompt(`search${lastSearch ? "|add" : ""}|done: `)
		if (cmd === exitCommand || cmd === "") {
			// Nothing
		} else if (cmd === "show") {
			console.log(JSON.stringify(configDef, null, 2));
		} else if (lastSearch && cmd.match(/\d+/)) {
			let entry = lastSearch[parseInt(cmd) - 1];
			if (entry == null) {
				console.log("Invalid Selection")
			} else {
				// TODO: what if the key already exists?
				console.log(`Adding ${entry.name} (${entry.service.toUpperCase()})`)
				configDef[entry.name] = entry.tokenizedValue;
			}
		} else {
			lastSearch = search(cmd);
			printSearch(lastSearch);
		}
	} while (cmd !== exitCommand && cmd != "")
	console.log(configDef);

	// Save file to the config location
	if (Object.keys(configDef).length > 0) {
		fs.writeFileSync(configPath, JSON.stringify(configDef, null, 2));
	}
}

module.exports = {
	editConfig
}

