var redis = require("redis"),
     config = require('../config');

var client = redis.createClient(config.redis_url)
var redis = {
	get : function (key, callback) {
		client.get(key, function(err, reply){
			if (!err) {
			    if (reply) {
			    	callback(reply.toString());
			    } else {
			    	callback(null);
			    }
			} else {
				callback(null);
			}
		});
	},
	getTop: function (key, callback) {
		client.lpop(key, function (err, val) {
			if (!err) {
				callback(val);
			} else {
				callback(null);
			}
		});
	},
	pushBottom: function (key, value) {
		client.rpush(key, value);
	},
	set: function (key, val) {
		client.set(key, val);
	},
	incr: function(key) {
		client.incr(key);
	}	
};

module.exports = redis;