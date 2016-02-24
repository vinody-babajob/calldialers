var uuid = require('uuid'),
	config = require('../config');


var ProgressiveDialer = function (telephonyClients, dataAccessor) {
	this.telephonyClients = telephonyClients;
	this.dataAccessor = dataAccessor;
	this.callerQueuePrefix = "caller_";
	this.receiverKeyPrefix = "recevier_";
	this.recevierCallCountPrefix = "recevier_call_count_";
	this.telephonyClientStatusPrefix = "telephony_client_status_";
	this.callerAvailabilityPrefix = "caller_avail_"
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
		var recevier = receiverNumbers[i];
		that.dataAccessor.pushBottom(that.callerQueuePrefix + callerNumber, receiverNumbers[i]);
		that.dataAccessor.set(that.receiverKeyPrefix + recevier, callerNumber);
		that.dataAccessor.set(that.recevierCallCountPrefix + recevier, 0);
	}

};

ProgressiveDialer.prototype.setCallerAvailabity = function (callerNumber, availability) {
	var that = this;
	that.dataAccessor.set(that.callerAvailabilityPrefix + callerNumber, availability);
}


ProgressiveDialer.prototype.getCallerAvailabity = function (callerNumber, callback) {
	var that = this;
	that.dataAccessor.get(that.callerAvailabilityPrefix + callerNumber, function (val) {
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

ProgressiveDialer.prototype.hasMoreReceviersForCaller = function (callerNumber, callback) {
	var that = this;
	that.dataAccessor.llen(that.callerQueuePrefix + callerNumber, function (noreceviers) {
		if (noreceviers && noreceviers > 0) {
			callback(true);
		} else {
			callback(false);
		}
	});
};

ProgressiveDialer.prototype.canCallerMakeCall = function (callerNumber, callback) {
	var that  = this;

	that.getCallerAvailabity(callerNumber, function (avial) {
		if (avial) {
			that.hasMoreReceviersForCaller(callerNumber, function (hasReceivers) {
				if (hasReceivers) {
					callback(true);
				} else {
					callback(false);
				}
			});
		} else {
			callback(false);
		}
	});
}

ProgressiveDialer.prototype.startCall = function (callerNumber) {
	var that = this,
		callid = uuid.v1();

	that.dataAccessor.set(that.callIdPrefix + callid, callerNumber);

	that.setCallerAvailabity(callerNumber, true);

	that.getActiveTelephonyClient(function(idx) {
		that.telephonyClients[idx].call({
			from : callerNumber,
			to : to,
			callid : callid
		});
	});
};

ProgressiveDialer.prototype.pauseCall = function (callerNumber) {
	var that = this;
	that.setCallerAvailabity(callerNumber, false);
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

	that.dataAccessor.get(that.recevierCallCountPrefix + receiverNumber, function (callcount) {
		if (callcount && callcount < config["calllimit"] && !connected) {
			that.dataAccessor.pushBottom(that.callerQueuePrefix+callerNumber
					,receiverNumber);
			that.dataAccessor.incr(that.recevierCallCountPrefix + receiverNumber);

			callback("success");
		} else {

			callback("failure!");
		}
	});
	
};

module.exports = ProgressiveDialer;