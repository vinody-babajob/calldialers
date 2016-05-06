var uuid = require('uuid'),
	config = require('../config');


var ProgressiveDialer = function (telephonyClients, dataAccessor) {
	this.telephonyClients = telephonyClients;
	this.dataAccessor = dataAccessor;
	this.callerQueuePrefix = "caller_";
	this.receiverKeyPrefix = "receiver_";
	this.receiverCallCountPrefix = "receiver_call_count_";
	this.telephonyClientStatusPrefix = "telephony_client_status_";
	this.callerAvailabilityPrefix = "caller_avail_";
	this.pauseAfterSuccessfulCallPrefix = "pause_after_success_";
};


ProgressiveDialer.prototype.getActiveTelephonyClient = function (callback) {
	var that = this;
	for (var i = 0; i < that.telephonyClients.length; ++i) {
		var key = that.telephonyClients[i].key;
		that.dataAccessor.get(that.telephonyClientStatusPrefix + key, (function(idx){
			return function (val) {
				if (val != null & val == "true") {
					callback(idx);
				}
			}
		})(i));
	}
};

ProgressiveDialer.prototype.queueCalls = function (callerNumber, receiverNumbers) {
	var that = this;

	for (var i = 0; i < receiverNumbers.length; ++i) {
		var receiver = receiverNumbers[i];
		that.dataAccessor.pushBottom(that.callerQueuePrefix + callerNumber, receiverNumbers[i]);
		that.dataAccessor.set(that.receiverKeyPrefix + receiver, callerNumber);
		that.dataAccessor.set(that.receiverCallCountPrefix + receiver, 0);
	}
};

ProgressiveDialer.prototype.clearQueue = function (callerNumber) {
	var that = this;
	that.dataAccessor.del(that.callerQueuePrefix + callerNumber);
};

ProgressiveDialer.prototype.setCallerAvailabity = function (callerNumber, availability) {
	var that = this;
	that.dataAccessor.set(that.callerAvailabilityPrefix + callerNumber, availability);
}

ProgressiveDialer.prototype.getCallerAvailabity = function (callerNumber, callback) {
	var that = this;
	that.dataAccessor.get(that.callerAvailabilityPrefix + callerNumber, function (val) {
		if (val && (val === "true" || val === "loop")) {
			callback(val);
		} else {
			callback("false");
		}
	});
}

ProgressiveDialer.prototype.setPauseAfterSuccessfulCall = function (callerNumber, pause) {
	var that = this;
	that.dataAccessor.set(that.pauseAfterSuccessfulCallPrefix + callerNumber, pause);
}

ProgressiveDialer.prototype.getPauseAfterSuccessfulCall = function (callerNumber, callback) {
	var that = this;
	that.dataAccessor.get(that.pauseAfterSuccessfulCallPrefix + callerNumber, function (val) {
		if (val && val == "true") {
			callback(true);
		} else {
			callback(false);
		}
	});
}

ProgressiveDialer.prototype.nextNumberToCall = function (callerNumber, callback) {
	var that = this;
	that.dataAccessor.getTop(that.callerQueuePrefix + callerNumber, function (receiverNumber) {
		if (receiverNumber && receiverNumber != "")
			callback(receiverNumber);
		else
			callback("");
	});
};

ProgressiveDialer.prototype.hasMorereceiversForCaller = function (callerNumber, callback) {
	var that = this;
	that.dataAccessor.llen(that.callerQueuePrefix + callerNumber, function (noreceivers) {
		if (noreceivers && noreceivers > 0) {
			callback(true);
		} else {
			callback(false);
		}
	});
};

ProgressiveDialer.prototype.canCallerMakeCall = function (callerNumber, callback) {
	var that  = this;

	that.getCallerAvailabity(callerNumber, function (avail) {
		console.log("-------------------------------------------Caller availability: "+avail);
		if ((avail === "true" || avail === "loop")) {
			that.hasMorereceiversForCaller(callerNumber, function (hasReceivers) {
				console.log("---------------------------------has receivers:" + hasReceivers);
				if (hasReceivers) {
					callback(avail);
				} else {
					callback(false);
				}
			});
		} else {
			callback(false);
		}
	});
}

ProgressiveDialer.prototype.startCall = function (callerNumber, pauseAfterSuccessfulCall) {
	var that = this,
		callid = uuid.v1();

	that.dataAccessor.set(that.callIdPrefix + callid, callerNumber);

	that.setCallerAvailabity(callerNumber, true);
	
	if (pauseAfterSuccessfulCall || pauseAfterSuccessfulCall == "true") {
		that.setPauseAfterSuccessfulCall(callerNumber, pauseAfterSuccessfulCall);
	}

	that.getActiveTelephonyClient(function(idx) {
		that.telephonyClients[idx].call({
			from : callerNumber,
			to: "",
			callid : callid
		});
	});
};

ProgressiveDialer.prototype.pauseCall = function (callerNumber) {
	var that = this;
	that.setCallerAvailabity(callerNumber, false);
};

ProgressiveDialer.prototype.resumeCall = function (callerNumber) {
	var that = this;
	that.setCallerAvailabity(callerNumber, true);
};

ProgressiveDialer.prototype.getCallerForReceiver = function (receiverNumber, callback) {
	var that = this;

	that.dataAccessor.get(that.receiverKeyPrefix + receiverNumber, function (callerNumber) {	
		if (callerNumber && callerNumber != "")
			callback(callerNumber);
		else
			callback("");
	});
};

ProgressiveDialer.prototype.updateCallStatus = function (callerNumber, receiverNumber, connected, callback) {
	var that = this;

	if (connected) {
		that.getPauseAfterSuccessfulCall(callerNumber, function(pause) {
		if (pause) {
			that.setCallerAvailabity(callerNumber, "loop");
		}});
	}
	
	that.dataAccessor.incr(that.receiverCallCountPrefix + receiverNumber, function (callcount) {
		if (callcount < config["calllimit"] && !connected) {
			that.dataAccessor.pushBottom(that.callerQueuePrefix+callerNumber
					,receiverNumber);
			callback("Re-Queued:" + receiverNumber);
		} else {
			callback("Call Limit Reached:" + receiverNumber);
		}
	});
	
};

module.exports = ProgressiveDialer;