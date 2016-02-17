var uuid = require('uuid');


var ProgressiveDialer = function (telephonyClient, dataAccessor) {
	this.telephonyClient = telephonyClient;
	this.dataAccessor = dataAccessor;
	this.agentQueuePrefix = "agent_queue_";
	this.customerKeyPrefix = "customer_agent_";
	this.callIdPrefix = "call_id_";
	this.agentContactPrefix = "agent_number_id_";
	this.callCountPrefix = "call_count_prefix_";
};

ProgressiveDialer.prototype.queueCalls = function (agentId, agentNumber, customerNumbers) {

	for (var i = 0; i < customerNumbers.length; ++i) {
		var customerNumber = customerNumbers[i];
		this.dataAccessor.pushBottom(this.agentQueuePrefix + agentId, customerNumbers[i]);
		this.dataAccessor.set(this.customerKeyPrefix + customerNumber, agentNumber);
		this.dataAccessor.set(this.callCountPrefix + customerNumber, 0);
	}

	this.dataAccessor.set(this.agentContactPrefix + agentNumber, agentId);

};

ProgressiveDialer.prototype.next = function (agentId) {
	var that = this;
	this.dataAccessor.getTop(this.agentQueuePrefix + agentId, function (val) {
		if (val != null) {
			var firstNumber = val;
			if (firstNumber) {
				that.getAgentForCustomer(firstNumber, function (to) {
					var callid = uuid.v1();

					that.dataAccessor.set(that.callIdPrefix + callid, firstNumber);

					that.telephonyClient.call({
						from : firstNumber,
						to : to,
						callid : callid
					});
				})
				
			}
		}
	});
};


ProgressiveDialer.prototype.getCustomerForCall = function (callid, callback) {
	this.dataAccessor.get(this.callIdPrefix + callid, function(val) {
		callback(val);
	});
}

ProgressiveDialer.prototype.getAgentForCustomer = function (customerNumber, callback) {
	this.dataAccessor.get(this.customerKeyPrefix + customerNumber, function (val) {
		callback(val);
	});
};

ProgressiveDialer.prototype.actionBaseOnCallStatus = function (callid, connected, callback) {
	var that = this;
	this.getCustomerForCall(callid, function(customerNumber){
		that.getAgentForCustomer(customerNumber, function(agentNumber) {
			console.log("connected");
			console.log(connected);
			if (connected) {
				callback(agentNumber);
			} else {
				that.dataAccessor.pushBottom("agent_finishedcall_queue", 
					{"agent": {"number":agentNumber}, "cnumber": customerNumber, "connected" : false});

				that.dataAccessor.get(that.agentContactPrefix + agentNumber, function (agentId) {


					that.dataAccessor.get(that.callCountPrefix + customerNumber, function (val) {
						if (val && val < 3) {
							console.log("callc");
							console.log(val);
							that.dataAccessor.incr(that.callCountPrefix + customerNumber);
							that.dataAccessor.pushBottom(that.agentQueuePrefix + agentId, customerNumber);
						};
					});

					if (agentId)
						that.next(agentId);
					callback(-1);

				});
			}
		});	
	});
	
};

module.exports = ProgressiveDialer;