var networkUtils = require('../networkutils');
var config = require('../config');

var kookoo = (function () {
	return {
    key: "kookoo",
    statusurl: "http://www.kookoo.in/outbound/outbound.php",
		call : function (callInfo) {
			var fromnumber = callInfo.from;
			var tonumber = callInfo.to;
			var callid = callInfo.callid;

			console.log(callInfo);

			var url = "http://www.kookoo.in/outbound/outbound.php";
			var data = {
        "api_key": "",
				"phone_number": fromnumber,
				"caller_id": "08039513882",
        "extra_data": "<response><dial record=\"true\" limittime=\"5000\" timeout=\"30\" moh=\"default\" >"+tonumber+"</dial></response>",
				"callback_url": config["baseurl"] + "callback?callid=" + callid
			};

			networkUtils.post(url, data, function (chunck) {
				console.log(chunck);
			});
		},
		normalizeData: function (data) {

  			var normalizeData = config["normalizedCallInfoFormat"];
  			normalizeData["From"] = data.phone_no;
  			normalizeData["To"] = data.caller_id;
  			normalizeData["Id"] = data.sid;
  			normalizeData["CallId"] = data.callid;

  			if (data.status) {
          var status = "busy";

          if (data.status == "answered") {
            status = "completed";
          }

  				normalizeData["Status"] = status;
  			}

  			return normalizeData;

		}
	}
})();

module.exports = kookoo;