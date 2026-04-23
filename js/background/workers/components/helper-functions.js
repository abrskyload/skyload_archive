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

var send = function send(cmd, msg) {
    return postMessage({
        cmd: cmd,
        msg: msg
    });
};

var listener = function listener(callback) {
    return addEventListener('message', function (e) {
        callback(e.data.cmd, e.data.msg);
    });
};

var log = function log() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    var params = ['Skyload'].concat(args.reduce(function (memo, item) {
        return memo.concat(['->', item]);
    }, []));

    console.info.apply(console, params);
};

var fetch = function fetch(url, onProgress, onStart, responseType) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        if (typeof responseType == 'string') {
            xhr.responseType = responseType;
        }

        xhr.open('GET', url, true);
        xhr.onload = function () {
            if (xhr.status < 200 || xhr.status > 400 || xhr.status === 204) {
                reject(new Error(xhr.statusText));
            }

            if (xhr.response) {
                resolve(xhr);
            } else {
                reject(new Error('Empty result'));
            }
        };

        xhr.onerror = function () {
            return reject(new Error('Network error'));
        };
        xhr.onprogress = onProgress;

        xhr.send();

        if (typeof onStart == 'function') {
            onStart(xhr);
        }
    });
};

var fetchBuffer = function fetchBuffer(url, onProgress, onStart) {
    return fetch(url, onProgress, onStart, 'arraybuffer').then(function (xhr) {
        return {
            buffer: xhr.response,
            size: parseInt(xhr.getResponseHeader("Content-Length"))
        };
    });
};