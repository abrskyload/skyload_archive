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

var meoptin = {};
meoptin.init = function () {
    chrome.runtime.sendMessage({ 'meoHTMLinit': true }, function (response) {
        meoptin.renderText(response.langResource);

        var policyUrl = 'http://skyload.io/privacy-policy';

        if (response.id) {
            policyUrl = 'https://go.myext.info/' + response.id + '/privacy.html';
        }

        document.getElementById('meoPrivacyPolicy').href = policyUrl;
        document.getElementById('meoAccept').addEventListener('click', function () {
            meoptin.meoEnable('on');
        });
        document.getElementById('meoCancel').addEventListener('click', function () {
            meoptin.meoEnable('off');
        });
    });
};
meoptin.renderText = function (langResource) {
    var langResourceMap = {
        "meoTitleHead": "meoTitle",
        "meoTitleHeader": "meoTitle",
        "meoPrivacyPolicy": "meoPrivacyPolicy",
        "meoAccept": "meoAccept",
        "meoCancel": "meoCancel"
    };
    for (var id in langResourceMap) {
        document.getElementById(id).textContent = langResource[langResourceMap[id]];
    }
    var manifest = chrome.runtime.getManifest();
    document.getElementById('meoTitleHead').textContent = manifest.name + ' : ' + langResource.meoTitle;
    document.getElementById('meoTitleHeader').textContent = manifest.name + ' : ' + langResource.meoTitle;

    var elements = document.getElementById('meoDescBox').getElementsByClassName('meoDescText');
    for (var i = 0; i < elements.length; i++) {
        elements[i].textContent = elements[i].textContent.replace(/\{EXTNAME\}/g, manifest.name);
    }
};
meoptin.meoEnable = function (status) {
    chrome.runtime.sendMessage({ 'meoEnableStatus': true, 'result': status }, function (response) {
        meoptin.windowClose();
    });
};
meoptin.windowClose = function () {
    var returnUrl = String(window.location.search).replace(/^\?/, '');
    if (returnUrl) {
        window.location.replace(decodeURIComponent(returnUrl));
    } else {
        chrome.runtime.sendMessage({ 'meoptWindowClose': true }, function (response) {});
    }
};
window.addEventListener("load", meoptin.init, false);