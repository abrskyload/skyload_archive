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

define('facebook', ['underscore'], function (_) {
    var Facebook = function () {
        function Facebook() {
            _classCallCheck(this, Facebook);

            this.sig = Skyload.SOURCE_FACEBOOK;
        }

        _createClass(Facebook, [{
            key: 'Get',
            value: function Get(videoId) {
                var _this = this;

                var url = 'https://www.facebook.com/watch/?v=' + videoId;

                url = 'https://www.facebook.com/plugins/video.php?' + $.param({ href: url });

                return Skyload.Methods.Fetch(url).then(function (html) {
                    var collection = [];

                    var findMatch = function findMatch(regexp, key) {
                        var matches = html.match(regexp);

                        if (matches) {
                            return _.chain(matches).map(function (match) {
                                try {
                                    var json = JSON.parse('{' + match + '}');
                                    return json[key];
                                } catch (e) {
                                    return null;
                                }
                            }).compact().uniq().value();
                        }

                        return [];
                    };

                    var findOnceMatch = function findOnceMatch(regexp) {
                        var matches = html.match(regexp);
                        return matches ? [matches[1]] : [];
                    };

                    var $output = $('<output>').append(html);

                    var title = $('title', $output).text();
                    var description = $('description', $output).attr('content');

                    var name = findMatch(/\"ownerName\":\s*\"([^\"]+)\"/gi, 'ownerName');
                    var id = findMatch(/\"video_id\":\s*\"([^\"]+)\"/gi, 'video_id');
                    var sd = findMatch(/\"sd_src_no_ratelimit\":\s*\"([^\"]+)\"/gi, 'sd_src_no_ratelimit');
                    var hd = findMatch(/\"hd_src_no_ratelimit\":\s*\"([^\"]+)\"/gi, 'hd_src_no_ratelimit');

                    if (!name.length) {
                        name = findOnceMatch(/ownerName:\s*\"([^\"]+)\"/);
                    }

                    if (!id.length) {
                        id = findOnceMatch(/video_id:\s*\"([^\"]+)\"/);

                        if (!id.length) {
                            id = [videoId];
                        }
                    }

                    if (!sd.length) {
                        sd = findOnceMatch(/sd_src_no_ratelimit:\s*\"([^\"]+)\"/);

                        if (!sd.length) {
                            sd = findMatch(/\"sd_src\":\s*\"([^\"]+)\"/gi, 'sd_src');
                        }

                        if (!sd.length) {
                            sd = $('meta[property="og:video:url"]', $output).attr('content');

                            if (sd) {
                                sd = [sd];
                            }
                        }
                    }

                    if (!hd.length) {
                        hd = findOnceMatch(/hd_src_no_ratelimit:\s*\"([^\"]+)\"/);

                        if (!hd.length) {
                            hd = findMatch(/\"hd_src\":\s*\"([^\"]+)\"/gi, 'hd_src');
                        }
                    }

                    if (!name.length) {
                        name = ['Facebook video'];
                    }

                    if (id.length < sd.length) {
                        throw new Error('Not found all ids');
                    }

                    if (!sd.length && !hd.length) {
                        throw new Error('Not found videos - ' + url);
                    }

                    var count = sd.length > hd.length ? sd.length : hd.length;

                    var _loop = function _loop(i) {
                        var model = {
                            id: id[i],
                            index: [_this.sig, id[i]].join('_'),
                            source: _this.sig,
                            name: description || title || name[i] || name[0],
                            data: { link: url },
                            cover: 'https://graph.facebook.com/' + id + '/picture'
                        };

                        model.play = _.chain({
                            sd: sd[i],
                            hd: hd[i]
                        }).map(function (src, type) {
                            if (!src) {
                                return;
                            }

                            var uri = Skyload.Methods.ParseURL(src);

                            if (!('path' in uri)) {
                                return;
                            }

                            var format = _.chain(uri.path.split('.')).compact().last().value().toLowerCase();

                            return {
                                id: id[i],
                                index: type,
                                quality: type.toUpperCase(),
                                url: src,
                                format: format,
                                mime_type: [Skyload.MEDIA_TYPE_VIDEO, format].join('/')
                            };
                        }).compact().value();

                        if (model.play.length) {
                            collection.push(model);
                        }
                    };

                    for (var i = 0; i <= count; i++) {
                        _loop(i);
                    }

                    return collection;
                });
            }
        }, {
            key: 'Call',
            value: function Call(id, callback) {
                return this.Get().catch(function () {
                    callback(null);
                });
            }
        }, {
            key: 'GetVideoIdFromURL',
            value: function GetVideoIdFromURL(url) {
                var id = null;

                try {
                    var _Skyload$parseURL = Skyload.parseURL(url),
                        queryString = _Skyload$parseURL.query,
                        path = _Skyload$parseURL.path;

                    var query = Skyload.Methods.ParseQuery(queryString);

                    if (path.indexOf('ajax/sharer') >= 0) {
                        id = query.id;
                    } else if (path.indexOf('/videos/') >= 0) {
                        id = _.last(path.split('/').filter(function (p) {
                            return p.length > 0;
                        }));
                    } else if (path.indexOf('/watch/') >= 0) {
                        id = query.v;
                    } else if (path.indexOf('permalink.php') >= 0) {
                        id = query.story_fbid;
                    }

                    if (!id) {
                        throw new Error('Id not found');
                    }

                    id = parseInt(id);
                } catch (e) {
                    return null;
                }

                return id;
            }
        }]);

        return Facebook;
    }();

    if (!(Skyload.LIB_FACEBOOK in Skyload)) {
        Skyload[Skyload.LIB_FACEBOOK] = new Facebook();
    }

    return Facebook;
});