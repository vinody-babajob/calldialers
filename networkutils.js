var querystring = require('querystring');
var request = require('request');

var NetworkUtils = (function() {
	return {
		post: function (url, data, callback) {
			request.post({url:url, 
				form:data}, 
				function(err,httpResponse,body){
					callback(body);
				});
		},
		get: function (url, data, callback) {
			request({
			    url: url, //URL to hit
			    qs: data, //Query string data
			    method: 'GET', //Specify the method
			}, function (error, response, body) {
			  	if (!error && response.statusCode == 200) {
			  		callback(response, body);
			  	} else {
			  		callback(null, null);
			  	}
			});
		} 
	};
})();

module.exports = NetworkUtils