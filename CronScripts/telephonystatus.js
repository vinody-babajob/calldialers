var redisAccessor = require('../DataAccessors/redis');
var exotelTelephonyClient = require('../TelephonyClients/exotel');
var kookooTelephonyClient = require('../TelephonyClients/kookoo');
var telephonyClientStatusPrefix = "telephony_client_status_";
var networkUtils = require('../networkUtils');

var clients = [exotelTelephonyClient, kookooTelephonyClient];

var conn = 0;

for (var i = 0; i < clients.length; ++i) {
	var client = clients[i];
	var clientKey = client.key;


	console.log(telephonyClientStatusPrefix + clientKey);

	networkUtils.get(client.statusurl, {}, (function (clientKey, idx) {

		return function (res, body) {
			var status = false;
			
			console.log(telephonyClientStatusPrefix + clientKey + "_done");

			if (res != null)
				status = true;

			redisAccessor.set(telephonyClientStatusPrefix + clientKey, status);

			if (conn == clients.length - 1)
				process.exit();

			conn++;
		}
	})(clientKey, i));
}