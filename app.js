var express = require('express');
var bodyParser = require('body-parser');
var routes = require('./routes');


var app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use('/', routes);


app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});