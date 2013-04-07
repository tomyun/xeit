(function () {
	function loadScript(url, callback) {
	    var script = document.createElement('script');
	    script.type = 'text/javascript';
	    script.src = url;
	    script.onload = script.onreadystatechange = callback;
	    document.head.appendChild(script);
	}

	if (!window.jQuery) {
		var jQueryURL = 'http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js';
		loadScript(jQueryURL, startUp);
	} else {
		startUp();
	}

	function startUp() {
		var $ = jQuery.noConflict();

		var envelope = {
			vendor: 'xe',
			smime_header: $('param[name="smime_header"]').val(),
			smime_body: $('param[name="smime_body"]').val(),
			ui_desc: $('param[name="ui_desc"]').val()
		};

		$('body').replaceWith($('<body>').css({
			margin: 0,
			padding: 0
		}));

		window.addEventListener('message', function (e) {
			$('#xeit')[0].contentWindow.postMessage(envelope, '*');
		}, false);

		$('<iframe>', {
			id: 'xeit',
			src: 'http://localhost:8000/xeit.html',
			frameborder: 0,
			css: {
				width: '100%',
				height: '100%',
				border: 0
			}
		}).appendTo('body');
	}
})();
