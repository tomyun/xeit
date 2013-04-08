(function () {
	var xeit = document.getElementById('xeit');
	if (xeit) {
		return;
	}

	var attachment = document.getElementsByTagName('body')[0].outerHTML;

	document.body = document.createElement('body');
	document.body.style.margin = 0;
	document.body.style.padding = 0;

	xeit = document.createElement('iframe');
	xeit.setAttribute('id', 'xeit');
	xeit.setAttribute('src', 'file:///Users/tomyun/Dropbox/SMIME/xeit/bootstrap/xeit.html');
	xeit.style.width = '100%';
	xeit.style.height = '100%';
	xeit.style.border = 0;
	document.body.appendChild(xeit);

	window.addEventListener('message', function (e) {
		xeit.contentWindow.postMessage(attachment, '*');
	}, false);
})();
