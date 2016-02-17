var querystring = require('querystring');
var request = require('request');

var NetworkUtils = (function() {
	return {
		"post": function (url, data, callback) {

			request.post({url:url, 
				form:data}, 
				function(err,httpResponse,body){
					callback(body);
				})
		}
	};
})();

module.exports = NetworkUtils