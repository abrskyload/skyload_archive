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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define('yandex', ['jquery', 'underscore', 'md5'], function ($, _, md5) {
    var Yandex = function () {
        function Yandex() {
            _classCallCheck(this, Yandex);

            this.get_api_download_url = _.template('https://<%= domain %>/api/v2.0/handlers/track/<%= id %>/download/m?hq=1');
            this.get_info_url = _.template('https://storage.mds.yandex.net/download-info/<%= dir %>/2?format=json&hq=1');

            this.get_download_info = _.template('https://<%= domain %>/api/v2.1/handlers/track/<%= track_id %>:<%= album_id %>/web-album-track-track-main/download/m?hq=1&overembed=no');
            this.get_album_link = _.template('https://<%= domain %>/album/<%= id %>');

            this.get_track_url = _.template('https://<%= domain %>/handlers/track.jsx?track=<%= id %>&hq=1');
            this.get_tracks_url = _.template('https://<%= domain %>/handlers/track-entries.jsx');
            this.get_artist_url = _.template('https://<%= domain %>/handlers/artist.jsx?artist=<%= id %>&what=<%= tab %>&hq=1');
            this.get_album_url = _.template('https://<%= domain %>/handlers/album.jsx?album=<%= id %>&hq=1');
            this.get_playlist_url = _.template('https://<%= domain %>/handlers/playlist.jsx?owner=<%= username %>&kinds=<%= id %>&light=true&overembed=false');
            this.get_library_url = _.template('https://<%= domain %>/handlers/library.jsx?owner=<%= username %>&filter=tracks&hq=1');

            this.domain = 'music.yandex.ru';
            this.salt = 'XGRlBW9FXlekgbPrRHuSiA';
            this.sig = Skyload.SOURCE_YANDEX;

            this.CACHE_TYPE_ALBUM = 'album';
            this.CACHE_TYPE_ARTIST = 'artist';
            this.CACHE_TYPE_PLAYLIST = 'playlists';
            this.CACHE_TYPE_USER = 'users';

            this.TAB_ARTIST_ALBUM = 'albums';
            this.TAB_ARTIST_TRACKS = 'tracks';

            this.max_count_list = 2000;

            this.hasPlus = false;

            this.cache = {};
        }

        _createClass(Yandex, [{
            key: 'SetDomain',
            value: function SetDomain(domain) {
                this.domain = domain;
                return this;
            }
        }, {
            key: 'Call',
            value: function Call(id, callback) {
                return this.Get(id).then(callback).catch(function (e) {
                    Skyload.setLog('Yandex Libs', 'Get error', e);
                    Skyload.Analytics('Yandex', 'Error', 'Get model', e.message);

                    callback(null);
                });
            }
        }, {
            key: 'Get',
            value: function Get(id, full) {
                return this.GetModel(id, full);
            }
        }, {
            key: 'GetCache',
            value: function GetCache(key) {
                return this.cache[key];
            }
        }, {
            key: 'ApplyPlus',
            value: function ApplyPlus() {
                this.hasPlus = true;

                return this;
            }
        }, {
            key: 'GetData',
            value: function GetData(url, headers) {
                return new Promise(function (resolve, reject) {
                    Skyload.Methods.XHR(url, function (response) {
                        try {
                            response = response.response;

                            if (response.status == 200) {
                                resolve(JSON.parse(response.responseText));
                            } else {
                                throw new Error('Response bad status (' + response.status + ')');
                            }
                        } catch (e) {
                            reject(e);
                        }
                    }, false, false, false, false, headers);
                });
            }
        }, {
            key: 'GetModel',
            value: function GetModel(id, full) {
                var _this = this;

                return this.GetData(this.get_track_url({ domain: this.domain, id: id })).then(function (json) {
                    return _this.GetModelFromData(json.track, full);
                });
            }
        }, {
            key: 'GetModelFromData',
            value: function GetModelFromData(track, full) {
                var _this2 = this;

                try {
                    var artist = _.first(track.artists);
                    var album = _.first(track.albums);

                    var author = 'Author',
                        name = 'Name',
                        trackId = parseInt(track.id),
                        storageDir = track.storageDir,
                        albumName = null,
                        albumId = null,
                        cover = null,
                        genre = null,
                        version = null,
                        year = null,
                        artists = [];

                    if (_.isUndefined(full)) {
                        full = true;
                    }

                    if ('title' in track) {
                        name = track.title;
                    }

                    if ('version' in track) {
                        version = track.version;
                    }

                    if (_.isObject(artist) && 'name' in artist) {
                        author = artist.name;
                    }

                    if ('artists' in track && _.isArray(track.artists) && track.artists.length > 1) {
                        artists = track.artists.map(function (artist) {
                            return artist.name;
                        });
                    }

                    if (_.isObject(album) && 'coverUri' in album) {
                        cover = (album.coverUri.substr(0, 4) != 'http' ? 'https://' : '') + album.coverUri.replace('%%', 'm40x40');
                    } else if (_.isObject(artist) && 'cover' in artist && _.isObject(artist.cover)) {
                        cover = (artist.cover.uri.substr(0, 4) != 'http' ? 'https://' : '') + artist.cover.uri.replace('%%', 'm40x40');
                    }

                    if (_.isObject(album) && 'genre' in album) {
                        if (_.isArray(album.genre)) {
                            genre = _.map(album.genre, function (genre) {
                                return Skyload.Methods.FirstUpperCase(genre);
                            }).join(';');
                        } else {
                            genre = Skyload.Methods.FirstUpperCase(album.genre);
                        }
                    }

                    if (_.isObject(album)) {
                        if ('id' in album) {
                            albumId = parseInt(album.id);
                        }

                        if ('year' in album) {
                            year = album.year;
                        }

                        if ('title' in album) {
                            albumName = album.title;
                        }
                    }

                    var model = {
                        index: [this.sig, trackId].join('_'),
                        id: trackId,
                        source: this.sig,
                        cover: cover,
                        album: albumName,
                        author: author,
                        artists: artists,
                        name: name,
                        genre: genre,
                        version: version,
                        year: year,
                        size: parseInt(track.fileSize),
                        duration: Math.round(parseInt(track.durationMs) / 1000),
                        mime_type: Skyload.AUDIO_MIME_TYPE_MP3
                    };

                    if (this.hasPlus) {
                        model.size = model.duration * 320 / 8 * 1000;
                    }

                    if (model.size === 0) {
                        model.size = model.duration * 192 / 8 * 1000;
                    }

                    if (full === true) {
                        return this.GetSoundLink(trackId, albumId, storageDir).then(function (_ref) {
                            var link = _ref.link,
                                bitrate = _ref.bitrate;

                            model.play = link;

                            if (_.isNumber(bitrate)) {
                                model.size = model.duration * bitrate / 8 * 1000;
                            }

                            if (albumId) {
                                return _this2.GetAlbum(albumId).then(function (collection) {
                                    var position = _.chain(collection).map(function (item, i) {
                                        return item.index === model.index ? i + 1 : null;
                                    }).compact().first().value();

                                    if (position) {
                                        model.position = position;
                                    }

                                    return model;
                                }).catch(function () {
                                    return model;
                                });
                            } else {
                                return model;
                            }
                        });
                    } else {
                        return Promise.resolve(model);
                    }
                } catch (e) {
                    return Promise.reject(e);
                }
            }
        }, {
            key: 'GetSoundLink',
            value: function GetSoundLink(trackId, albumId, storage) {
                var _this3 = this;

                var url = this.get_download_info({
                    domain: this.domain,
                    track_id: trackId,
                    album_id: albumId
                });

                var headers = {
                    'X-Retpath-Y': this.get_album_link({ domain: this.domain, id: albumId })
                };

                var bitrate = null;

                return this.GetData(url, headers).then(function (json) {
                    bitrate = json.bitrate;

                    return json;
                }).then(function (json) {
                    var src = json.src + '&format=json';

                    if (src.substr(0, 4) !== 'http') {
                        src = 'https:' + src;
                    }

                    return _this3.GetData(src);
                }).then(function (json) {
                    return _this3.GetLinkFromJSON(json);
                }).then(function (link) {
                    return { link: link, bitrate: bitrate };
                }).catch(function () {
                    url = _this3.get_api_download_url({ domain: _this3.domain, id: trackId });

                    return _this3.GetData(url).then(function (json) {
                        return _this3.GetData(json.src + '&format=json');
                    }).then(function (json) {
                        return _this3.GetLinkFromJSON(json);
                    }).then(function (link) {
                        return { link: link, bitrate: bitrate };
                    }).catch(function () {
                        return _this3.GetData(_this3.get_info_url({ dir: storage })).then(function (json) {
                            return _this3.GetLinkFromJSON(json);
                        }).then(function (link) {
                            return { link: link, bitrate: bitrate };
                        });
                    });
                });
            }
        }, {
            key: 'GetLinkFromJSON',
            value: function GetLinkFromJSON(json) {
                var salt = md5(this.salt + json.path.substr(1) + json.s);
                var link = 'https://' + json.host + '/get-mp3/' + salt + '/' + json.ts + json.path;

                return link;
            }
        }, {
            key: 'GetArtist',
            value: function GetArtist(id, tab) {
                var _this4 = this;

                if (!tab) {
                    tab = this.TAB_ARTIST_TRACKS;
                }

                var index = [this.CACHE_TYPE_ARTIST, id, tab].join('_');

                if (index in this.cache) {
                    return Promise.resolve(this.cache[index]);
                } else {
                    return this.GetData(this.get_artist_url({ domain: this.domain, id: id, tab: tab })).then(function (json) {
                        return _this4.GetCollectionByIds(json.trackIds);
                    }).then(function (collection) {
                        _this4.cache[index] = collection;

                        return collection;
                    });
                }
            }
        }, {
            key: 'GetAlbum',
            value: function GetAlbum(id) {
                var _this5 = this;

                var index = [this.CACHE_TYPE_ALBUM, id].join('_');

                if (index in this.cache) {
                    return Promise.resolve(this.cache[index]);
                } else {
                    return this.GetData(this.get_album_url({ domain: this.domain, id: id })).then(function (json) {
                        return new Promise(function (resolve, reject) {
                            if ('volumes' in json) {
                                var volumes = json.volumes;
                                var collection = [];

                                var callback = _.after(volumes.length, function () {
                                    if (collection.length) {
                                        _this5.cache[index] = collection;
                                        resolve(collection);
                                    } else {
                                        reject(new Error('Collection is empty'));
                                    }
                                });

                                _.each(volumes, function (volume) {
                                    _.each(volume, function (track, i) {
                                        _this5.GetModelFromData(track, false).then(function (model) {
                                            model.position = i + 1;

                                            if ('labels' in json) {
                                                model.label = _.map(json.labels, function (label) {
                                                    return label.name;
                                                }).join(';');
                                            }

                                            collection.push(model);
                                            callback();
                                        }).catch(function () {
                                            return callback();
                                        });
                                    });
                                });
                            } else {
                                throw new Error('Tracks not found in album');
                            }
                        });
                    });
                }
            }
        }, {
            key: 'GetPlaylist',
            value: function GetPlaylist(username, id) {
                var _this6 = this;

                var index = [this.CACHE_TYPE_PLAYLIST, username, id].join('_');

                if (index in this.cache) {
                    return Promise.resolve(this.cache[index]);
                } else {
                    return this.GetData(this.get_playlist_url({ domain: this.domain, username: username, id: id })).then(function (json) {
                        return _.map(json.playlist.trackIds, function (item) {
                            return item.toString().indexOf(':') >= 0 ? _.first(item.split(':')) : item;
                        });
                    }).then(function (ids) {
                        return _this6.GetCollectionByIds(ids);
                    }).then(function (collection) {
                        _this6.cache[index] = collection;

                        return collection;
                    });
                }
            }
        }, {
            key: 'GetUserTracks',
            value: function GetUserTracks(username) {
                var _this7 = this;

                var index = [this.CACHE_TYPE_USER, username].join('_');

                if (index in this.cache) {
                    return Promise.resolve(this.cache[index]);
                } else {
                    return this.GetData(this.get_library_url({ domain: this.domain, username: username })).then(function (json) {
                        if (json.success) {
                            return _this7.GetCollectionByIds(json.trackIds);
                        } else {
                            throw new Error('Success error');
                        }
                    }).then(function (collection) {
                        _this7.cache[index] = collection;

                        return collection;
                    });
                }
            }
        }, {
            key: 'GetCollectionByData',
            value: function GetCollectionByData(data) {
                var _this8 = this;

                return new Promise(function (resolve) {
                    var collection = [];

                    var async = _.after(data.length, function () {
                        resolve(collection);
                    });

                    _.each(data, function (track) {
                        _this8.GetModelFromData(track, false).then(function (model) {
                            collection.push(model);
                            async();
                        }).catch(function () {
                            async();
                        });
                    });
                });
            }
        }, {
            key: 'GetCollectionByIds',
            value: function GetCollectionByIds(ids) {
                var _this9 = this;

                if (!_.isArray(ids)) {
                    throw new Error('Param ids must be array');
                }

                var count = ids.length;
                var max_sync_count = 300;

                if (count > this.max_count_list) {
                    return this.GetCollectionByIds(ids.slice(0, this.max_count_list));
                } else if (count > max_sync_count) {
                    return new Promise(function (resolve) {
                        var list = [];
                        var iterations = Math.round(count / max_sync_count) + 1;

                        var async = _.after(iterations, function () {
                            resolve(list);
                        });

                        for (var i = 1; i <= iterations; i++) {
                            var start = 0,
                                end = max_sync_count;

                            if (i > 1) {
                                end = max_sync_count * i;
                                start = end - max_sync_count;
                            }

                            var slice = ids.slice(start, end);

                            if (slice.length) {
                                _this9.GetCollectionByIds(slice).then(function (collection) {
                                    list = list.concat(collection);
                                    async();
                                }).catch(function () {
                                    return async();
                                });
                            } else {
                                async();
                            }
                        }
                    });
                } else {
                    return new Promise(function (resolve, reject) {
                        Skyload.Methods.XHR(_this9.get_tracks_url({ domain: _this9.domain }), function (response) {
                            try {
                                response = response.response;

                                if (response.status == 200) {
                                    resolve(JSON.parse(response.responseText));
                                } else {
                                    throw new Error('Response bad status (' + response.status + ')');
                                }
                            } catch (e) {
                                reject(e);
                            }
                        }, 'POST', null, $.param({
                            entries: ids.join(','),
                            strict: false
                        }));
                    }).then(function (json) {
                        return _this9.GetCollectionByData(json);
                    });
                }
            }
        }]);

        return Yandex;
    }();

    if (!(Skyload.LIB_YANDEX in Skyload)) {
        Skyload[Skyload.LIB_YANDEX] = new Yandex();
    }

    return Yandex;
});