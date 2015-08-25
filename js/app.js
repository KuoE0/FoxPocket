
'use strict';

function debug(str) {
	console.log("-*- FoxPocket -*- " + str);
}

var FoxPocket = {

	_ACCESS_TOKEN: undefined,
	REDIRECT_URI: "https://getpocket.com/auth/success.html",
	POCKET_URI: "https://getpocket.com/a/",

	// this.CONSUMER_KEY
	get CONSUMER_KEY() {
		if (this._CONSUMER_KEY === undefined) {
			this._CONSUMER_KEY = gCONSUMER_KEY;
		}
		debug("CONSUMER_KEY: " + this._CONSUMER_KEY);
		return this._CONSUMER_KEY;
	},

	// this.ACCESS_TOKEN = token
	set ACCESS_TOKEN(token) {
		debug("Set ACCESS_TOKEN to " + token);
		this._ACCESS_TOKEN = token;
	},

	// this.ACCESS_TOKEN
	get ACCESS_TOKEN() {
		if (this._ACCESS_TOKEN === undefined) {

		}
		debug("ACCESS_TOKEN: " + this._ACCESS_TOKEN);
		return this._ACCESS_TOKEN;
	},

  init: function fp_init() {

  },

	// start authenticate from Pocket
	authenticate: function(callback) {
		debug("start authenticating...");
		// get request token to open authentication page
		this._post(
			"https://getpocket.com/v3/oauth/request",
			JSON.stringify({
				consumer_key: this.CONSUMER_KEY,
				redirect_uri: this.REDIRECT_URI
			}),
			response => {
				debug("Request Token: " + response.code);
				this._openAuthenticationPage(response.code, callback);
			}
		);
	},
	// open Pocket authentication page to continue authenticating
	_openAuthenticationPage: function(requestToken, callback) {
		debug("open authentication page...");
		debug("request token: " + requestToken);
		var authUrl = [
			"https://getpocket.com/auth/authorize?request_token=",
			requestToken,
			"&redirect_uri=",
			this.REDIRECT_URI
		].join("");
		debug("Auth URI: " + authUrl);

		// open authentication page in an iframe
		var authWin = document.createElement('iframe');
		authWin.setAttribute('src', authUrl);
		authWin.setAttribute('mozbrowser', true);
		authWin.setAttribute('mozallowfullscreen', true);
		authWin.setAttribute('remote', true);
    authWin.setAttribute('class', 'fullscreen');

		// listen the locationchange event to check the authentication state
		authWin.addEventListener('mozbrowserlocationchange', evt => {
			var url = new URL(evt.detail);
			debug("Location Changed: " + url.href);
			debug(url.protocol + '//' + url.host + url.pathname);

			if (url.protocol + '//' + url.host + url.pathname == "https://getpocket.com/a/") {
				debug("OAuth Succeed!");
				document.body.removeChild(authWin);
				this._openAuthenticationPage(requestToken, callback);
			}
			else if (url.href == this.REDIRECT_URI) {
				debug("OAuth Succeed!");
				// request the access token
				this._getAccessToken(requestToken, callback);
				document.body.removeChild(authWin);
			}

		});

		document.body.appendChild(authWin);

	},

	_getAccessToken: function(requestToken, callback) {
		debug("request access token...");
		this._post(
			"https://getpocket.com/v3/oauth/authorize",
			JSON.stringify({
				consumer_key: this.CONSUMER_KEY,
				code: requestToken
			}),
			response => {
				debug("Access Token: " + response.access_token);
				this.ACCESS_TOKEN = response.access_token;
				if (callback) {
					callback();
				}
			}
		);
	},

	// post method to fetch data
	_post: function(url, data, callback) {
		debug("_post");
		var request = new XMLHttpRequest({
			mozSystem: true
		});

		debug(data);
		request.addEventListener("load", evt => {
			debug("Request Status: " + request.status);
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

	retrieve: function(count) {
		this._post(
			"https://getpocket.com/v3/get",
			JSON.stringify({
				consumer_key: this.CONSUMER_KEY,
				access_token: this.ACCESS_TOKEN,
				count: count,
				detailType: 'simple'
			}),
			response => {
				debug(JSON.stringify(response));

        var list = response.list;
        var readingList = document.getElementById('reading-list');

        Object.keys(list).map(key => {
          var item = list[key];
          var elem = document.createElement('a');
          elem.href = item.resolved_url;
          elem.textContent = item.resolved_title;
          elem.className = "list-group-item";
          readingList.appendChild(elem);
        });
			}
		);

	},

};

// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
	document.getElementById('btn-auth').addEventListener('click', FoxPocket.authenticate.bind(FoxPocket, FoxPocket.retrieve.bind(FoxPocket, 100)));
});

FoxPocket.init();

