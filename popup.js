// Get the current URL.
// 	callback - called when the URL of the current tab is found
function getCurrentTabUrl(callback) {
	var queryInfo = {
		active: true,
		currentWindow: true
	};

	chrome.tabs.query(queryInfo, function(tabs) {
		var url = tabs[0].url;
		console.assert(typeof url == 'string', 'tab.url should be a string');
		callback(url);
	});
}

// CORS request. For future purposes
//	method - HTTP method
//	url    - URL requested
function createCORSRequest(method, url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		// Check if the XMLHttpRequest object has a "withCredentials" property.
		// "withCredentials" only exists on XMLHTTPRequest2 objects.
		xhr.open(method, url);
	} else if (typeof XDomainRequest != "undefined") {
		// Otherwise, check if XDomainRequest.
		// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
		xhr = new XDomainRequest();
		xhr.open(method, url);
	} else {
		// Otherwise, CORS is not supported by the browser.
		xhr = null;
	}
	return xhr;
}

// converts and downloads video. For future purposes
//	url - URL of video
//	callback - called when the conversion is done
//	errorCallback - called when there is an error
function convertVideo(url, callback, errorCallback) {
	var downloadUrl = 'http://www.youtubeinmp3.com/fetch/?video='+encodeURIComponent(url);

	var xhr = createCORSRequest('GET', downloadUrl);
	if (!xhr) {
		errorCallback('CORS not supported');
	}
	xhr.overrideMimeType("application/octet-stream");
	xhr.responseType = "arraybuffer";
	xhr.onload = function() {
		var bb = new (window.BlobBuilder || window.WebKitBlobBuilder)();
		var res = xhr.response;
		if (!res) {
			errorCallback('No response from conversion server');
			return;
		}
		var byteArray = new Uint8Array(res);
		bb.append(byteArray.buffer);
		var blob = bb.getBlob("application/octet-stream");
		var iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = window.webkitURL.createObjectURL(blob);
		document.body.appendChild(iframe);

		callback(imageUrl, width, height);
	};
	xhr.onerror = function() {
		errorCallback('Network error');
	};
	xhr.send();
}

// fetches the download link and title in JSON format
//	url - URL of video
//	callback - called when the conversion is done
//	errorCallback - called when there is an error
function getLink(url, callback, errorCallback) {
	var downloadUrl = 'http://www.youtubeinmp3.com/fetch/?format=json&video='+encodeURIComponent(url);

	var xhr = new XMLHttpRequest();
	xhr.open('GET', downloadUrl);
	xhr.responseType = 'json';
	xhr.onload = function() {
		// Parse and process the response
		var res = xhr.response;
		if (res===null) {
			errorCallback('No response from Google Image search!');
			return;
		}
		var videoTitle = res.title;
		var videoLink = res.link;
		callback(videoTitle, videoLink);
	};
	xhr.onerror = function() {
		errorCallback('Network error.');
	};
	xhr.send();
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function renderLink(linkText) {
	var ln = document.getElementById('downloadlink');
	ln.href = linkText;
	ln.onclick = function () {
		chrome.tabs.create({active: true, url: linkText});
	}
}

function hideLink() {
	document.getElementById('downloadlink').style.visibility = 'hidden';
}

document.addEventListener('DOMContentLoaded', function() {
    getCurrentTabUrl( function(url) {
		if(url.includes('www.youtube.com/watch')) {
			renderStatus('Downloading');

			getLink(url, function(title,link) {
				renderStatus(title);
				renderLink(link);
			}, function(errorMessage) {
				renderStatus('Cannot convert video. ' + errorMessage);
			});
		} else  {
			renderStatus('Not a youtube page. Can\'t download mp3');
			hideLink();
		}
	});
});