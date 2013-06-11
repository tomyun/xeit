// derived from xeit.js
function check() {
    var html = document.head.innerHTML + document.body.innerHTML;
    return document.getElementById('XEIViewer') ||
           html.search(/IniMasPlugin|IniCrossMailObj/) > -1 ||
           document.getElementById('JXCEAL') ||
           document.getElementById('MailDec');
}

// (almost) copy of link.js
function link() {
    var xeit = document.getElementById('xeit');
    if (xeit) {
        return;
    }

    window.stop();
    var attachment = document.getElementsByTagName('html')[0].outerHTML;

    document.documentElement.style.height = '100%';

    var _body = document.body;
    document.body = document.createElement('body');
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.height = '100%';

    xeit = document.createElement('iframe');
    xeit.setAttribute('id', 'xeit');
    xeit.setAttribute('src', 'http://tomyun.github.io/xeit/xeit.html');
    xeit.style.width = '100%';
    xeit.style.height = '100%';
    xeit.style.border = 0;
    document.body.appendChild(xeit);

    window.addEventListener('message', function (e) {
        switch (e.data) {
            case 'ready':
            xeit.contentWindow.postMessage(attachment, '*');
            break;

            case 'fallback':
            document.body = _body;
            break;
        }
    }, false);
}

function show() {
    chrome.runtime.sendMessage({});
}

if (check()) {
    link();
    show();
}
