var xeit = (function () {
    "use strict";

    var worker = new Worker('http://localhost:8080/vendor.js');
    function work(cmd, args, success, failure) {
        worker.addEventListener('message', function (e) {
            if (e.data.cmd == cmd) {
                success(e);
            }
        });
        worker.addEventListener('error', function (e) {
            failure(e);
        });
        worker.postMessage({
            cmd: cmd,
            args: args
        });
    }

    return {
        init: function (html, success, failure) {
            //HACK: <object> 태그의 상위 노드로써 DOM에 임시로 추가하여 query 수행.
            var $doc = $('<div>', { id: 'Xeit-temp' }).hide().appendTo($('body')).append($.parseHTML(html));
            if ($('#XEIViewer').length) {
                work('SoftForum', [
                    html,
                    $('param[name="smime_header"]').val(),
                    $('param[name="smime_body"]').val(),
                    $('param[name="info_msg"]').val(),
                    $('param[name="ui_option"]').val(),
                    $('param[name="ui_desc"]').val()
                ], success, failure);
            } else if (/prtObj\(([\s\S])*\);/.test(html)) {
                //TODO: LGU+ 인식용으로 기존 로직과 병합 가능성 확인 필요. (by RyanYoon)
                var data = html.match(/prtObj\(([\s\S])*\);/)[0].match(/[^']+(?!,)/g);
                work('SoftForum', [
                    html,
                    data[5],
                    data[7],
                    data[9],
                    data[11],
                    data[13]
                ], success, failure);
            } else if (html.indexOf('IniMasPlugin') > -1) {
                //HACK: IE에서만 동작하는 activeControl() (function.js) 이슈 회피.
                var body = html.replace(
                    /activeControl\(([\s]*['"])/,
                    "var activeControl = function (a, b, c) {" +
                        "var d = document.createElement('div');" +
                        "d.innerHTML = \"<OBJECT ID='IniMasPluginObj'>\" + a;" +
                        "d.firstChild.innerHTML = b + c;" +
                        "document.getElementById('embedControl').appendChild(d);" +
                    "}($1"
                ).replace(
                    /^[\s\S]*<body.*?>|<\/body>[\s\S]*$/ig,
                    ''
                );
                $doc.empty().append($.parseHTML(body, true));
                work('SoftForum', [
                    html,
                    $('param[name="IniSMContents"]').val(),
                    $('param[name="AttachedFile"]').val()
                ], success, failure);
            } else if (html.indexOf('IniCrossMailObj') > -1) {
                work('IniTech', [
                    html,
                    $('param[name="IniSMContents"]').val(),
                    $('param[name="AttachedFile"]').val(),
                    $('param[name="OptData"]').val()
                ], success, failure);
            } else if ($('#JXCEAL').length) {
                work('Soft25', [
                    html,
                    $('#JSEncContents').val()
                ], success, failure);
            } else if ($('#MailDec').length) {
                work('Natingtel', [
                    html,
                    $('param[name="DocumentMail"]').val()
                ], success, failure);
            } else {
                work('Vendor', [], success, failure);
            }
            $doc.remove();
        },

        load: function (password, success, failure) {
            work('load', [
                password
            ], success, failure);
        }
    };
})();
