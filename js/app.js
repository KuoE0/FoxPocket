
'use strict';

function debug(str) {
	console.log("-*- FoxPocket -*- " + str);
}

var Pocket = {

	REDIRECT_URI: "app://772bb765-bb36-4242-b179-55688b5df274/manifest.webapp",

	get CONSUMER_KEY() {
		if (this._CONSUMER_KEY === undefined) {
			this._CONSUMER_KEY = gCONSUMER_KEY;
		}
		debug("CONSUMER_KEY: " + this._CONSUMER_KEY);
		return this._CONSUMER_KEY;
	},

	authenticate: function(callback) {
		debug("start authenticating...");
		this._post(
			"https://getpocket.com/v3/oauth/request",
			JSON.stringify({
				consumer_key: this.CONSUMER_KEY,
				redirect_uri: this.REDIRECT_URI
			}),
			response => {
				this._storeAccessToken(response.code, callback);
			}
		);
	},

	_post: function(url, data, callback) {
		debug("_post");
		var request = new XMLHttpRequest({
			mozSystem: true
		});

		debug(data);
		request.addEventListener("load", evt => {

			debug("request status: " + request.status);
			if (request.status === 200 && callback) {
				var response = JSON.parse(request.responseText);
				callback(response);
			}

		}, false);

		request.open("POST", url);
		request.setRequestHeader("Content-type", "application/json; charset=UTF8");
		request.setRequestHeader("X-Accept", "application/json");
		request.send(data || null);
	},

	_storeAccessToken: function(accessToken, callback) {
		debug("get access token...");
		debug("access token: " + accessToken);
	}

};

// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
	document.getElementById('btn-auth').addEventListener('click', Pocket.authenticate.bind(Pocket));
});

