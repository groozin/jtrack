
var fs = require('fs'),
	papa = require('papaparse');

function mapIssues(results) {
	var issues = results.map(x => {
		return {
			fields: {
				project: {
					key: 'BMO00023'
				},
				summary: `${x['Defect ID']} ${x.Title}`,
				description: x['Symptom (Problem Description)'],
				issuetype: {
					name: 'Bug'
				},
				reporter: {
					name: 'tmikos'
				},
				priority: {
					name: `Priority ${x.Severity[0]}`
				},
				assignee: {
					name: 'tmikos'
				},
				customfield_10002: 4
			}
		}
	});
	return issues;
}

function callback(err, data) {
	if (err) throw err;
	console.log(data);

	papa.parse(data, {
		delimiter: ";",
		complete: function (results) {
			console.log(results);
			var issuesToCreate = mapIssues(results.data);
			issuesToCreate.forEach(function(issue) {
				var cissue = require('./create.js');
				cissue.create(issue);
			});
		},
		header: true
	});
}

fs.readFile('defects.csv', 'utf8', callback);
