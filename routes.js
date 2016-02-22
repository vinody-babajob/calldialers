
var express = require('express');
var router = express.Router();
var redisAccessor = require('./DataAccessors/redis');

var exotelTelephonyClient = require('./TelephonyClients/exotel');
var kookooTelephonyClient = require('./TelephonyClients/kookoo');

var ProgressiveDialer = require('./Dialers/progressive');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var clients = [exotelTelephonyClient];//[exotelTelephonyClient, kookooTelephonyClient];

var progressiveDialer = new ProgressiveDialer(clients, redisAccessor);


// define the home page route
router.get('/', function(req, res) {
  res.send('Progressive Dialer home page');
});

router.post('/queuecalls', function(req, res) {
	var queInfo = req.body;
	progressiveDialer.queueCalls(queInfo["agentId"], queInfo["agentNumber"], queInfo["customerNumbers"]);
	res.send("success");
});

router.post('/callback', upload.array(), function(req, res) {
	var data = {};

	for (var key in req.query) {
		data[key] = req.query[key];
	}

	for (var key in req.body) {
		data[key] = req.body[key];
	}
	
	var telephonyData = exotelTelephonyClient.normalizeData(data);
	var connected = true;

	if (telephonyData["Status"] != "completed") {
		connected  = false;
		
	}

	progressiveDialer.actionBaseOnCallStatus(telephonyData["CallId"], connected, function (val) {
		if (val != null) {

		}
 	});

 	res.send("success");
});

router.get('/agentnumber', function(req, res) {
	var telephonyData = exotelTelephonyClient.normalizeData(req.query);
	progressiveDialer.getAgentForCustomer(telephonyData["From"], function(val) {
		if (val != null) {
			res.send(val);
		} else {
			res.send(-1);
		}
		
	});
});

router.post('/callnext', function(req, res) {
	var agentInfo = req.body;
	var agentId = agentInfo["agentId"];
	progressiveDialer.next(agentId);
	res.send("success");
});

module.exports = router