// derived from xeit.js
function check() {
    var html = document.head.innerHTML + document.body.innerHTML;
    return document.getElementById('XEIViewer') ||
           html.search(/XEIViewer|IniMasPlugin|IniCrossMailObj/) > -1 ||
           document.getElementById('JXCEAL') ||
           document.getElementById('MailDec');
}

// (almost) copy of link.js
function link() {
    var doc = document;
    var xeit = doc.getElementById('xeit');
    if (xeit) {
        return;
    }

    window.addEventListener('message', function (e) {
        if (e.data == 'ready') {
            xeit.contentWindow.postMessage(attachment, '*');
        } else if (e.data == 'fallback') {
            doc.body = _body;
        }
    });

    var html = doc.documentElement;
    var attachment = html.outerHTML;
    html.style.height = '100%';

    var _body = doc.body;
    var body = doc.body = doc.createElement('body');
    body.style.cssText = 'margin:0;padding:0;height:100%';

    xeit = doc.createElement('iframe');
    xeit.id = 'xeit';
    xeit.src = 'http://tomyun.github.io/xeit/xeit.html' + '?chrome';
    xeit.style.cssText = 'width:100%;height:100%;border:0';
    body.appendChild(xeit);
}

function show() {
    chrome.runtime.sendMessage({});
}

if (check()) {
    link();
    show();
}
