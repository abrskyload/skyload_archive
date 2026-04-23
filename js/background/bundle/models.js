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

define('models', ['sound_model', 'video_model', 'video_item_model', 'download_model', 'notification_model', 'access_model'], function (SoundModel, VideoModel, VideoItemModel, DownloadModel, NotificationModel, AccessModel) {
    var Models = function () {
        function Models() {
            _classCallCheck(this, Models);
        }

        _createClass(Models, [{
            key: 'SoundCache',
            get: function get() {
                return SoundModel;
            }
        }, {
            key: 'VideoCache',
            get: function get() {
                return VideoModel;
            }
        }, {
            key: 'VideoItemModel',
            get: function get() {
                return VideoItemModel;
            }
        }, {
            key: 'DownloadCache',
            get: function get() {
                return DownloadModel;
            }
        }, {
            key: 'AccessCache',
            get: function get() {
                return AccessModel;
            }
        }, {
            key: 'NotificationModel',
            get: function get() {
                return NotificationModel;
            }
        }]);

        return Models;
    }();

    return Models;
});