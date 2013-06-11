var xeit = (function () {
    "use strict";

    function parse($doc, html) {
        if ($('#XEIViewer').length) {
            return {
                func: 'init',
                opts: { plugin: 'SoftForum' },
                args: [
                    html,
                    $('param[name="smime_header"]').val(),
                    $('param[name="smime_body"]').val(),
                    $('param[name="info_msg"]').val(),
                    $('param[name="ui_option"]').val(),
                    $('param[name="ui_desc"]').val()
                ]
            };
        } else if (/prtObj\(([\s\S])*\);/.test(html)) {
            //TODO: LGU+ 인식용으로 기존 로직과 병합 가능성 확인 필요. (by RyanYoon)
            var data = html.match(/prtObj\(([\s\S])*\);/)[0].match(/[^']+(?!,)/g);
            return {
                func: 'init',
                opts: { plugin: 'SoftForum' },
                args: [
                    html,
                    data[5],
                    data[7],
                    data[9],
                    data[11],
                    data[13]
                ]
            };
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

            return {
                func: 'init',
                opts: { plugin: 'IniTech' },
                args: [
                    html,
                    $('param[name="IniSMContents"]').val(),
                    $('param[name="AttachedFile"]').val()
                ]
            };
        } else if (html.indexOf('IniCrossMailObj') > -1) {
            return {
                func: 'init',
                opts: { plugin: 'IniTech' },
                args: [
                    html,
                    $('param[name="IniSMContents"]').val(),
                    $('param[name="AttachedFile"]').val(),
                    $('param[name="OptData"]').val()
                ]
            };
        } else if ($('#JXCEAL').length) {
            return {
                func: 'init',
                opts: { plugin: 'Soft25' },
                args: [
                    html,
                    $('#JSEncContents').val()
                ]
            };
        } else if ($('#MailDec').length) {
            return {
                func: 'init',
                opts: { plugin: 'Natingtel' },
                args: [
                    html,
                    $('param[name="DocumentMail"]').val()
                ]
            };
        } else {
            return {
                func: 'init',
                opts: { plugin: 'Vendor' },
                args: []
            }
        }
    }

    function check(html) {
        //HACK: <object> 태그의 상위 노드로써 DOM에 임시로 추가하여 query 수행.
        var $doc = $('<div>', { id: 'Xeit-temp' }).hide().appendTo($('body')).append($.parseHTML(html));
        var info = parse($doc, html);
        $doc.remove();
        return info;
    }

    var worker = new Worker('js/worker.js');
    function work(func, opts, args, success, failure) {
        worker.addEventListener('message', function (e) {
            if (e.data.func == func) {
                success(e.data.resp);
            }
        });
        worker.addEventListener('error', function (e) {
            failure(e);
        });
        worker.postMessage({
            func: func,
            opts: opts,
            args: args
        });
    }

    return {
        init: function (html, success, failure) {
            var info = check(html);
            work(info.func, info.opts, info.args, success, failure);
        },

        load: function (password, success, failure) {
            work('load', {}, [password], success, failure);
        }
    };
})();
