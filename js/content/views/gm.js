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

define('GM', ['APP', 'underscore', 'jquery'], function (Skyload, _) {
    Skyload.Custodian.Require('GM', function () {
        return Skyload.AppView.extend({
            findSoundInfo: function findSoundInfo() {
                var _this = this;

                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        try {
                            var $player = _this.$el.find('#player');

                            if (!$player.length) {
                                throw new Error('Not found player in page');
                            }

                            var model = {
                                author: $player.find('#player-artist,[data-type="artist"]').first().text(),
                                name: $player.find('#currently-playing-title').text(),
                                album: $player.find('.player-album,[data-type="album"]').first().text(),
                                cover: $player.find('#playerBarArt').attr('src')
                            };

                            if (!model.author || !model.name) {
                                throw new Error('Not found current information');
                            }

                            if (_.isString(model.cover) && model.cover.indexOf('=s90-') >= 0) {
                                model.cover = model.cover.replace('s90', 's200');
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