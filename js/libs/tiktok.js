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

define('tiktok', ['underscore'], function (_) {
    var Tiktok = function () {
        function Tiktok() {
            _classCallCheck(this, Tiktok);

            this.sig = Skyload.SOURCE_TIKTOK;
        }

        _createClass(Tiktok, [{
            key: 'Get',
            value: function Get() {
                return Promise.reject(new Error('Not have implements yet'));
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
                        path = _Skyload$parseURL.path;

                    id = _.last(_.compact(path.split('/')));
                    id = parseInt(id);
                } catch (e) {
                    return null;
                }

                return id;
            }
        }, {
            key: 'GetVideoFromURL',
            value: function GetVideoFromURL(url) {
                var _this = this;

                return Skyload.Methods.Fetch(url).then(function (html) {
                    var $output = $('<output>').append(html);

                    var script = $('script[id="__NEXT_DATA__"]', $output);

                    if (!script.length) {
                        throw new Error('Script not found');
                    }

                    var json = JSON.parse(script.text());

                    if (!_.isObject(json)) {
                        throw new Error('Json not found');
                    }

                    var videoData = json.props.pageProps.itemInfo.itemStruct;
                    var video = videoData.video,
                        author = videoData.author;


                    var index = [_this.sig, video.id].join('_');
                    var quality = video.width + 'x' + video.height;

                    return {
                        id: id,
                        index: index,
                        source: _this.sig,
                        name: videoData.desc || author.nickname,
                        data: { link: url },
                        cover: video.cover,
                        duration: video.duration,
                        play: [{
                            id: id,
                            index: index + '_' + quality,
                            quality: quality,
                            url: video.downloadAddr || video.playAddr,
                            format: Skyload.VIDEO_FORMAT_MP4,
                            mime_type: Skyload.VIDEO_MIME_TYPE_MP4
                        }]
                    };
                });
            }
        }]);

        return Tiktok;
    }();

    if (!(Skyload.LIB_TIKTOK in Skyload)) {
        Skyload[Skyload.LIB_TIKTOK] = new Tiktok();
    }

    return Tiktok;
});