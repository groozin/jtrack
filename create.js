var request = require('request-promise');
const urlPath = 'https://track.infusion.com/rest/api/2/issue/';

function create(issue) {
	var options = {
    method: 'POST',
    uri: urlPath,
    body: issue,
    json: true,
		auth: {
			user: 'tmikos',
			password: '**'
		}
	}

	request(options)
		.then(function (parsedBody) {
			
		})
		.catch(function (err) {
			for (var prop in err) console.log(`err.${prop}: ${err[prop]}`);
		});
}

module.exports.create = create;