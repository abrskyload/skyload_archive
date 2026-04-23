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

define('video_item_model', ['backbone'], function (Backbone) {
    return Backbone.Model.extend({
        defaults: {
            url: null,
            download_id: null,
            quality: null,
            format: null,
            index: null,
            size: 0,
            mime_type: null
        },
        idAttribute: 'index',
        getSize: function getSize() {
            var _this = this;

            if (this.get('size')) {
                return Promise.resolve(this.get('size'));
            }

            if (!Skyload.isURL(this.get('url'))) {
                return Promise.reject(new Error('Invalid video url'));
            }

            return new Promise(function (resolve, reject) {
                Skyload.Methods.GetFileSize(_this.get('url'), function (response) {
                    try {
                        var size = response.fileSize;

                        if (response.status < 200 || response.status > 400 || response.status === 204) {
                            throw new Error('Bad response status');
                        }

                        if (!size) {
                            throw new Error('Size is 0');
                        }

                        resolve(size);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).then(function (size) {
                _this.set('size', size);

                return size;
            });
        }
    });
});