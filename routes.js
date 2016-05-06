var events = new require('events')
var eventEmitter = new events.EventEmitter();
var express = require('express');
var router = express.Router();
var cors = require('cors');
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

//router.options('/*', cors());
// define the home page route
router.get('/', function(req, res) {
	var query = req.query;
	//var caller = query["caller"];
	//var receiver = query["receiver"];
	//if (caller)
	//{
	//	console.log('---emitting callStart for ' + caller + 'to ' + receiver + '---');
	//	eventEmitter.emit('callStart', {caller: callData["Caller"], receiver: nextnumber});
	//}
	res.send('Progressive Dialer home page');
});

router.post('/queuecalls', function(req, res, next) {
	var queInfo = req.body;
	progressiveDialer.queueCalls(queInfo["caller"], queInfo["receivers"]);
	res.send("success");
});

router.post('/clearqueue', function(req, res, next) {
	var queInfo = req.body;
	progressiveDialer.clearQueue(queInfo["caller"]);
	console.log('--- Clearing Queue for ' + queInfo["caller"] + ' ---');
	res.send("success");
});

router.get('/nextnumbertocall', function(req, res) {
	var query = req.query;
	
	var telephonyClient = telephonyClients[query["telephonyprovider"]];
	console.log(query["telephonyprovider"]);
	var callData = telephonyClient.normalizeData(query);
	
	if (query["numbers"])
	{
		console.log("-----Useless Callback Start-----");
		console.log(query["numbers"])
		console.log("-----Useless Callback END-----")
		var connected = false;

		if (callData["ReceiverStatus"] == "completed") {
			connected = true;
		}
		
		progressiveDialer.updateCallStatus(
			callData["Caller"],
			callData["Receiver"],
			connected,
			function (updatestatus) {
				console.log("------------------------------status Updated : " + updatestatus);
			}
		);
		res.send("");
		return;
	}

	progressiveDialer.nextNumberToCall(
		callData["Caller"],
		function (nextnumber) {
			if (nextnumber) {
				eventEmitter.emit('callStarted', {caller: callData["Caller"], receiver: nextnumber});
			}
			res.send(nextnumber);
		}
	);
});

router.get('/canmakenextcall', function(req, res) {
	var query = req.query;

	var telephonyClient = telephonyClients[query["telephonyprovider"]];
	var callData = telephonyClient.normalizeData(query);
	
	progressiveDialer.canCallerMakeCall(
				callData["Caller"],
				function (canmakecalls) {
					//var result = "false"
					//if (canmakecalls)
					//	result = "true";
					console.log("canMakeCalls : " + canmakecalls);
					if (canmakecalls === "loop") {
						eventEmitter.emit('callPaused', {caller: callData["Caller"]});
					} else if (canmakecalls === false) {
						eventEmitter.emit('callEnded', {caller: callData["Caller"]});
					}
					if (query["telephonyprovider"] == "exotel") {
						res.setHeader('Content-Type', 'application/json');
						var json = JSON.stringify({
							select: canmakecalls
						});
						res.send(json);
					} else {
						res.send(canmakecalls);
					}
	});
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
	var caller = callInfo["caller"];
	progressiveDialer.pauseCall(caller);

	res.send("success");
});

router.post('/resumecall', function(req, res) {
	var callInfo = req.body;
	var caller = callInfo["caller"];
	progressiveDialer.resumeCall(caller);

	res.send("success");
});


router.post('/startcall', function(req, res) {
	var callInfo = req.body;
	var pause = callInfo["pauseAfterSuccessfulCall"];
	var caller = callInfo["caller"];
	progressiveDialer.startCall(caller, pause);

	res.send("success");
});

router.EventEmitter = eventEmitter;
module.exports = router