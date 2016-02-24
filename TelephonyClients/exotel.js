var networkUtils = require('../networkutils');
var config = require('../config');

var exotel = (function () {
	return {
		key: "exotel",
		statusurl: "http://my.exotel.in/",
		call : function (callInfo) {
			var fromnumber = callInfo.from;
			var tonumber = callInfo.to;
			var callid = callInfo.callid;

			console.log(callInfo);

			var url = "https://babajob:3d209a5f29257609b442a0525eb44196ec77fc7e@twilix.exotel.in/v1/Accounts/babajob/Calls/connect";
			var data = {
				"From": fromnumber,
				"CallerId":"08039513882",
				"CallType": "trans",
				"Url":"http://my.exotel.in/exoml/start/68135",
				"CustomField":callid,
				"StatusCallback": config.baseurl + "callback?callid=" + callid
			};

			networkUtils.post(url, data, function (chunck) {
				console.log(chunck);
			});
		},
		normalizeData: function (data) {
  // {CallSid: 'd50e19c31e3911190a7e601f1056d69a',
  // CallFrom: '07799828555',
  // CallTo: '8039513882',
  // CallStatus: 'ringing',
  // Direction: 'outbound-dial',
  // ForwardedFrom: '',
  // Created: 'Tue, 16 Feb 2016 15:56:26',
  // DialCallDuration: '0',
  // StartTime: '2016-02-16 15:56:26',
  // EndTime: '0000-00-00 00:00:00',
  // CallType: 'incomplete',
  // DialWhomNumber: '',
  // flow_id: '68135',
  // tenant_id: '39',
  // From: '07799828555',
  // To: '08039513882',
  // CurrentTime: '2016-02-16 15:56:49' }

  			var normalizeData = config["normalizedCallInfoFormat"];
        var callerStatus = "";
        var receiverStatus = "";
  			
        normalizeData["Caller"] = data.CallFrom;
  			normalizeData["Cid"] = data.CallSid;

        if (data.DialWhomNumber) {
          normalizeData["Receiver"] = data.DialWhomNumber;
        }

        if (data.CallType) {
          callerStatus = data.CallType;
        }

  			if (data.CallStatus) {
          callerStatus = data.CallStatus;
  			}

        if (data.DialCallStatus) {
          receiverStatus = data.DialCallStatus;
        }

        if (receiverStatus != "completed") {
          receiverStatus = "incomplete";
        }

        normalizeData["ReceiverStatus"] = receiverStatus;
        normalizeData["CallerStatus"] = callerStatus;

  			return normalizeData;

		}
	}
})();

module.exports = exotel;