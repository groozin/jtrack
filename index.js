var request = require('request-promise'),
	queryString = require('querystring'),
	fs = require('fs'),
	papa = require('papaparse'),
	prompt = require('prompt');

const urlPath = 'https://track.infusion.com/rest/api/2/search/'
const filter = 'project="Branch Operational Procedures" AND issuetype=Bug \
	AND (fixVersion not in versionMatch("BMO.*") OR fixVersion is EMPTY) \
	AND (labels is EMPTY OR labels not in (Reopen)) ORDER BY summary ASC'
const fields = 'summary,fixVersions,aggregatetimespent,created,labels,status,comment';

var schema = {
	properties: {
		name: {
			required: true
		},
		password: {
			hidden: true,
			required: true
		}
	}
};

function extractRootCause(commentField) {
	const matchRootCause = /\*Cause\*([\s\S]*)\*Solution\*/;
	return match(commentField, matchRootCause);
}

function match(commentField, regex) {
	var allResolutionComments = commentField.comments.filter(c => c.body.startsWith("*Cause*")).map(k => k.body);
	if (allResolutionComments.length < 1) return;
	var resolutionComment = allResolutionComments[0]; 
	const expectedMatchIndex = 1;
	const expectedNumberOfMatches = 2;
	var matches = resolutionComment.match(regex);
	
	if (matches === null || matches.length != expectedNumberOfMatches) return;  
	return matches[expectedMatchIndex].trim();
}

function extractSolution(commentField) {
	const matchSolution = /\*Solution\*([\s\S]*)/;
	return match(commentField, matchSolution);
}

// prompt.start();
// prompt.get(schema, function (err, result) {
// 	if (err) {
// 		console.log(err);
// 		return;
// 	}
// 	run(result);
// });

run({name: 'tmikos', password: '6StokrotkA23'});

function run(result) {
	var queryParameters = {};
	queryParameters.jql = filter;
	queryParameters.fields = fields;
	queryParameters.maxResults = 100;

	var options = {};
	options.uri = `${urlPath}?${queryString.stringify(queryParameters)}`;
	options.auth = {};
	console.log(result.name);
	console.log(result.password);
	options.auth.user = result.name;
	options.auth.password = result.password;

	request(options)
	.then(function (resBodyInJson) {
		var response = JSON.parse(resBodyInJson);
		var issues = response.issues;
		var mapped = issues.map(x => {
			return {
				key: x.key,
				externalId: x.fields.summary.trim().substr(0, 3),
				title: x.fields.summary.trim().substring(4),
				status: x.fields.status.name,
				fixVersions: x.fields.fixVersions.map(v => v.name).join(','),
				timespent: x.fields.aggregatetimespent,
				created: x.fields.created,
				labels: x.fields.labels.join(','),
				rootCause: extractRootCause(x.fields.comment),
				solution: extractSolution(x.fields.comment)
			}
		});
		var csv = papa.unparse(mapped);
		console.log(csv);
		fs.writeFile('bugs.csv', csv, (err) => {
			if (err) throw err;
			console.log('Bugs saved to bugs.csv file.');
		});
	})
	.catch(function (err) {
		for (var prop in err) {
			console.log(`err.${prop}: ${err[prop]}`);
		}
	});
}


