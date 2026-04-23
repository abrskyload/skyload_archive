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

var meopref = {};

meopref.init = function () {
    chrome.runtime.sendMessage({ 'meoHTMLinit': true }, function (response) {
        meopref.renderText(response.langResource, response.meoEnable);
    });
};

meopref.renderText = function (langResource, meoEnable) {
    var meoBox = document.getElementById('meoPreferences');

    var meoCaption = document.createElement('div');
    meoCaption.style.fontWeight = 'bold';
    meoCaption.textContent = langResource.meoTitle;
    meoBox.appendChild(meoCaption);

    var meoStatus = document.createElement('div');
    meoStatus.textContent = meoEnable == 'on' ? langResource.meoEnabled : langResource.meoDisabled;
    meoBox.appendChild(meoStatus);

    var meoButton = document.createElement('input');
    meoButton.type = 'button';
    meoButton.value = langResource.meoChangeStatus;
    meoButton.addEventListener('click', function () {
        window.location.replace('/meoptin.html?' + encodeURIComponent(window.location.href));
    });
    meoBox.appendChild(meoButton);
};

window.addEventListener("load", meopref.init, false);