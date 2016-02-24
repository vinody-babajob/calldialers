
var express = require('express');
var router = express.Router();
var redisAccessor = require('./DataAccessors/redis');

var exotelTelephonyClient = require('./TelephonyClients/exotel');
var kookooTelephonyClient = require('./TelephonyClients/kookoo');

var ProgressiveDialer = require('./Dialers/progressive');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var telephonyClients = {
	"exotel" : exotelTelephonyClient,
	"kookoo" : kookooTelephonyClient
};

var clients = [exotelTelephonyClient];//[exotelTelephonyClient, kookooTelephonyClient];

var progressiveDialer = new ProgressiveDialer(clients, redisAccessor);


// define the home page route
router.get('/', function(req, res) {
  res.send('Progressive Dialer home page');
});

router.post('/queuecalls', function(req, res) {
	var queInfo = req.body;
	progressiveDialer.queueCalls(queInfo["caller"], queInfo["receivers"]);
	res.send("success");
});

router.get('/nextnumbertocall', function(req, res) {
	var telephonyClient = telephonyClients[query["telephonyprovider"]];
	var callData = telephonyClient.normalizeData(query);

	progressiveDialer.nextNumberToCall(function (nextnumber) {
		res.send(nextnumber);
	});
});

router.get('/canmakenextcall', function(req, res) {
	var query = req.query;

	var telephonyClient = telephonyClients[query["telephonyprovider"]];
	var callData = telephonyClient.normalizeData(query);

	var connected = false;

	if (callData["ReceiverStatus"] == "completed") {
		connected = true;
	}

	progressiveDialer.updateCallStatus(
		callData["Caller"],
		callData["Receiver"],
		connected,
		function (updatestatus) {

		}
	);

	ProgressiveDialer.canCallerMakeCall(
		callData["Caller"],
		function (canmakecalls) {
			res.send(canmakecalls);
		}
	);

});

router.post('/callback', upload.array(), function(req, res) {
	// var data = {};

	// for (var key in req.query) {
	// 	data[key] = req.query[key];
	// }

	// for (var key in req.body) {
	// 	data[key] = req.body[key];
	// }
});

router.post('/pausecall', function(req, res) {
	var callInfo = req.body;
	var caller = agentInfo["caller"];
	progressiveDialer.pauseCall(caller);

	res.send("success");
});


router.post('/startcall', function(req, res) {
	var callInfo = req.body;
	var caller = agentInfo["caller"];
	progressiveDialer.startCall(caller);

	res.send("success");
});

module.exports = router