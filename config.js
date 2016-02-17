 

var config = {
	"callbackurl" : "http://localhost/",
	"normalizedCallInfoFormat" : {
		"Id":"",
		"From": "",
		"To": "",
		"Status": "",
		"CallRecording": "",
		"CallType":"",
		"CallId":""
	},
	"calllimit" : 3,
	"redis_url": "redis://127.0.0.1:6379/1"
};

module.exports = config;