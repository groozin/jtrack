var request            = require('request-promise');
var queryString        = require('querystring');
var fs                 = require('fs');
var papa               = require('papaparse');

const urlPath          = 'https://track.infusion.com/rest/api/2/search/'
const filter           = 'project="Branch Operational Procedures" AND issuetype=Bug AND (fixVersion not in versionMatch("BMO.*") OR fixVersion is EMPTY) ORDER BY summary ASC'
const fields           = 'summary,fixVersions,aggregatetimespent,created,labels,status';

var queryParameters    = {};
queryParameters.jql    = filter;
queryParameters.fields = fields;

var options            = {};
options.uri            = `${urlPath}?${queryString.stringify(queryParameters)}`;
options.auth           = {};
options.auth.user      = '*****';
options.auth.password  = '**********';

request(options).then(function(resBodyInJson){
	var response = JSON.parse(resBodyInJson);
	var issues = response.issues;
	var mapped = issues.map(x => {
		return {
			key:         x.key,
			externalId:  x.fields.summary.trim().substr(0,3),
			title:       x.fields.summary.trim().substring(4),
			status:      x.fields.status.name,
			fixVersions: x.fields.fixVersions.map(v => v.name).join(','),
			timespent:   x.fields.aggregatetimespent,
			created:     x.fields.created,
			labels:      x.fields.labels.join(',')
		}
	});
	var csv = papa.unparse(mapped);
	
	console.log(csv);
	fs.writeFile('bugs.csv', csv, (err) => {
		if (err) throw err;
		console.log('Bugs saved to bugs.csv file.');
	});
}).catch(function(err){
	console.log(err);
});
