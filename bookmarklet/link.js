(function () {
    var xeit = document.getElementById('xeit');
    if (xeit) {
        return;
    }

    var attachment = document.getElementsByTagName('html')[0].outerHTML;

    var _body = document.body;
    document.body = document.createElement('body');
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.height = '100%';

    xeit = document.createElement('iframe');
    xeit.setAttribute('id', 'xeit');
    xeit.setAttribute('src', 'file:///Users/tomyun/Dropbox/SMIME/xeit/bootstrap/xeit.html');
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
})();
