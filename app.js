var app = require('express')();
var bodyParser = require('body-parser');
var routes = require('./routes');
var eventEmitter = routes.EventEmitter;
var events = new require('events')
var eventEmitterNew = new events.EventEmitter();
var dataAccessor = require('./DataAccessors/redis');
var cors = require('cors');

//app.use(allowCrossDomain);
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(cors());
app.use('/', routes);



var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'example.com');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    next();
};
//app.listen(3000, function () {
//	console.log('Example app listening on port 3000!');
//});

var server = require('http').Server(app);
server.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
var io = require('socket.io')(server);

var dialer = io
  .of('/dialer')
  .on('connection', function (socket) {
	console.log('-----A User connected-----');
	socket.on('createSession', function (SessionId) {
		console.log('SessionId stored for ' + SessionId);
		dataAccessor.set('socket_'+SessionId, socket.id);
	});
  });
  
eventEmitter.on('callStarted', function (callData) {
	var socketId = dataAccessor.get('socket_'+callData["caller"], function (socketId) {
		if (socketId)
		{
			console.log('dialer socket called with callStart for : ' + callData);
			dialer.to(socketId).emit('callStart', callData["receiver"]);
		}
	});
});

eventEmitter.on('callEnded', function (callData) {
	var socketId = dataAccessor.get('socket_'+callData["caller"], function (socketId) {
		if (socketId)
		{
			console.log('dialer socket called with callEnd for : ' + callData);
			dialer.to(socketId).emit('callEnd');
		}
	});
});

eventEmitter.on('callPaused', function (callData) {
	var socketId = dataAccessor.get('socket_'+callData["caller"], function (socketId) {
		if (socketId)
		{
			console.log('dialer socket called with callPause for : ' + callData);
			dialer.to(socketId).emit('callPause');
		}
	});
});