var request = require('request-promise'),
	queryString = require('querystring'),
	fs = require('fs'),
	papa = require('papaparse'),
	prompt = require('prompt');

const urlPath = 'https://track.infusion.com/rest/api/2/search/'
const filter = 'project="Branch Operational Procedures" AND issuetype=Bug AND (fixVersion not in versionMatch("BMO.*") OR fixVersion is EMPTY) ORDER BY summary ASC'
const fields = 'summary,fixVersions,aggregatetimespent,created,labels,status';

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
//schema.properties.password.hidden = true;
prompt.start();
prompt.get(schema, function (err, result) {
	var queryParameters = {};
	queryParameters.jql = filter;
	queryParameters.fields = fields;

	var options = {};
	options.uri = `${urlPath}?${queryString.stringify(queryParameters)}`;
	options.auth = {};
	console.log(result.name);
	console.log(result.password);
	options.auth.user = result.name;
	options.auth.password = result.password;

	request(options).then(function (resBodyInJson) {
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
				labels: x.fields.labels.join(',')
			}
		});
		var csv = papa.unparse(mapped);

		console.log(csv);
		fs.writeFile('bugs.csv', csv, (err) => {
			if (err) throw err;
			console.log('Bugs saved to bugs.csv file.');
		});
	}).catch(function (err) {
		console.log(err);
	});
});


