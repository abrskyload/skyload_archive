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

"use strict";

var fileSystem = function fileSystem(name, type, size) {
    return new Promise(function (resolve, reject) {
        webkitRequestFileSystem(TEMPORARY, size, function (fileSystem) {
            var getFile = function getFile() {
                return new Promise(function (resolve, reject) {
                    fileSystem.root.getFile(name, { create: true }, function (fileEntry) {
                        resolve(fileEntry);
                    }, function (e) {
                        reject(new Error(e.toString()));
                    });
                });
            };

            var appendToFile = function appendToFile(chunk) {
                return getFile().then(function (fileEntry) {
                    return new Promise(function (resolve, reject) {
                        fileEntry.createWriter(function (fileWriter) {
                            fileWriter.onwriteend = function () {
                                resolve();
                            };

                            fileWriter.onerror = function (e) {
                                reject(new Error(e.currentTarget.error.message));
                            };

                            fileWriter.seek(fileWriter.length);
                            fileWriter.write(new Blob([chunk], { type: type }));
                        }, function (e) {
                            reject(new Error(e.toString()));
                        });
                    });
                });
            };

            var removeFile = function removeFile() {
                return getFile().then(function (fileEntry) {
                    return new Promise(function (resolve, reject) {
                        fileEntry.remove(function () {
                            resolve();
                        }, function (e) {
                            reject(new Error(e.toString()));
                        });
                    });
                });
            };

            var getURL = function getURL() {
                return getFile().then(function (fileEntry) {
                    return fileEntry.toURL();
                });
            };

            resolve({
                getFile: getFile,
                getFileURL: getURL,
                removeFile: removeFile,
                appendToFile: appendToFile
            });
        }, function (e) {
            reject(new Error(e.toString()));
        });
    });
};