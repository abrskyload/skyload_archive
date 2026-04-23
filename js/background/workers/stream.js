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

importScripts('components/helper-functions.js', 'components/file-system.js');

var _count = 5;

var _playlist = [];
var _type = '';
var _size = 0;
var _name = '';

var _buffer = null;
var _xhr = [];
var _stop = false;

var _totalSize = [];
var _loadedSize = [];

var getURL = function getURL() {
    return fileSystem(_name, _type, _size).then(function (file) {
        return new Promise(function (resolve, reject) {
            try {
                _buffer = [];
                _xhr = [];

                if (!_playlist.length) {
                    throw new Error('Empty playlist');
                }

                var can = function can(index) {
                    return new Promise(function (resolve) {
                        if (index <= 0) {
                            resolve();
                        } else {
                            if (_buffer[index - 1] === true) {
                                resolve();
                            } else {
                                setTimeout(function () {
                                    resolve(can(index));
                                }, 1000);
                            }
                        }
                    });
                };

                var queue = function queue() {
                    if (_stop) {
                        return;
                    }

                    var index = _playlist.map(function (v, k) {
                        return k;
                    }).find(function (i) {
                        return !_xhr[i];
                    });
                    var url = _playlist[index];

                    if (typeof url == 'string') {
                        fetchBuffer(url, function (progress) {
                            var updateSizeTrigger = true;

                            if (!_totalSize[index] && progress.total) {
                                _totalSize[index] = progress.total;
                            } else {
                                updateSizeTrigger = false;
                            }

                            if (progress.loaded) {
                                _loadedSize[index] = progress.loaded;
                            }

                            var total = _totalSize.reduce(function (memo, size) {
                                return memo + size;
                            }, 0) / _totalSize.length * _playlist.length;
                            var loaded = _loadedSize.reduce(function (memo, size) {
                                return memo + size;
                            }, 0);

                            var percent = (loaded / (total / 100)).toFixed(2);

                            if (percent > 100) {
                                percent = 100;
                            }

                            send('progress', percent);

                            if (updateSizeTrigger) {
                                send('update_size', total);
                            }
                        }, function () {
                            _xhr[index] = true;

                            if (_xhr.length < _playlist.length && _xhr.length - _buffer.length < _count) {
                                queue();
                            }
                        }).then(function (response) {
                            var chunk = new Uint8Array(response.buffer);

                            if (!_totalSize[index]) {
                                if (response.size) {
                                    _totalSize[index] = response.size;
                                    _loadedSize[index] = response.size;
                                } else {
                                    var blob = new Blob([chunk], { type: _type });
                                    _totalSize[index] = blob.size;
                                    _loadedSize[index] = blob.size;
                                }
                            }

                            return can(index).then(function () {
                                return file.appendToFile(chunk);
                            });
                        }).then(function () {
                            _buffer[index] = true;

                            queue();
                        }).catch(function (e) {
                            _stop = true;
                            _buffer[index] = true;

                            reject(e);
                        });
                    } else if (_xhr.length === _buffer.length) {
                        file.getFileURL().then(function (url) {
                            resolve(url);
                        }).catch(function (e) {
                            reject(e);
                        });
                    }
                };

                queue();
            } catch (e) {
                reject(e);
            }
        });
    });
};

listener(function (cmd, msg) {
    try {
        switch (cmd) {
            case 'init':
                _playlist = msg.playlist;
                _type = msg.type;
                _size = msg.size;
                _name = msg.name;

                log('Init stream', _type, _size, _name);

                break;
            case 'start':
                getURL().then(function (url) {
                    send('url', url);
                }).catch(function (e) {
                    send('error', e.message);
                });

                break;
            case 'stop':
                _stop = true;

                fileSystem(_name, _type, 1024).then(function (file) {
                    return file.removeFile();
                }).then(function () {
                    log('Remove file', 'Success');
                    close();
                }).catch(function (e) {
                    send('error', e.message);
                    log('Remove file', 'Fail');
                    close();
                });

                break;
        }
    } catch (e) {
        send('error', e.message);
    }
});