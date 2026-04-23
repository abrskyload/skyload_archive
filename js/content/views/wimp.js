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

define('WIMP', ['APP', 'underscore', 'jquery'], function (Skyload, _) {
    Skyload.Custodian.Require('WIMP', function () {
        return Skyload.AppView.extend({
            findSoundInfo: function findSoundInfo() {
                var _this = this;

                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        try {
                            var $player = _this.$el.find('.player[role="navigation"]');

                            if (!$player.length) {
                                throw new Error('Not found player in page');
                            }

                            var model = {
                                author: $player.find('a[data-bind="name"]').text(),
                                name: $player.find('a[data-bind="title"]').text(),
                                cover: $player.find('img[data-bind-src="imageUrl"]').attr('src')
                            };

                            if (!model.author || !model.name) {
                                throw new Error('Not found current information');
                            }

                            if (_.isString(model.cover) && model.cover.indexOf('80x80') >= 0) {
                                model.cover = model.cover.replace('80x80', '320x320');
                            }

                            resolve(model);
                        } catch (e) {
                            reject(e);
                        }
                    }, 300);
                });
            }
        });
    });
});