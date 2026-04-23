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

define('TT', ['APP', 'backbone', 'underscore', 'jquery', 'tiktok'], function (Skyload, Backbone, _, $) {
    Skyload.Custodian.Require('TT', function () {
        var TIKTOK = _.extend({}, SkyloadDefaultComponents);

        TIKTOK.Settings = Backbone.Model.extend({
            defaults: {
                delay: 2000,
                sig: Skyload.SOURCE_TIKTOK
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new TIKTOK.Settings();
        var VideoCollection = Skyload.Instance.GetInstance(Skyload.TYPE_VIDEO, Settings.get('sig'));

        return Skyload.AppView.extend({
            initialize: function initialize() {
                var _this = this;

                this.init();
                this.parse = true;

                this.parseMainAttr = attrId;
                this.parseElemAttr = attrId + '-index';
                this.parseTypeAttr = attrId + '-type';
                this.parseCountAttr = attrId + '-count';
                this.parseIgnoreAttr = attrId + '-ignore';

                this.listenToOnce(VideoCollection, 'reset', function () {
                    return _this.render();
                });
                this.checkAccess();
            },
            render: function render() {
                var _this2 = this;

                this.parseElem('a[href*="/video/"][' + attrId + '=set]:not([' + attrId + '=error])', VideoCollection);

                setInterval(function () {
                    if (_this2.isActive()) {
                        var $elem = _this2.$el.find('a[href*="/video/"]:not([' + attrId + '])');

                        if ($elem.length) {
                            $elem.each(function (i, link) {
                                var $link = $(link);

                                $link.attr(attrId, 'get');

                                try {
                                    var url = $link.attr('href');

                                    var id = Skyload.Tiktok.GetVideoIdFromURL(url);

                                    if (_.isNumber(id) && _.isString(url)) {
                                        var model = VideoCollection.get(id);

                                        if (model instanceof Backbone.Model && model.isCached()) {
                                            _this2.markElem($link, model);
                                        } else {
                                            Skyload.Tiktok.GetVideoFromURL(url).then(function (model) {
                                                VideoCollection.save(model).then(function (model) {
                                                    _this2.markElem($link, model);
                                                }).catch(function (e) {
                                                    Skyload.setLog('TT', 'Save video error', e);
                                                });

                                                return model;
                                            }).catch(function (e) {
                                                $link.attr(attrId, 'error');
                                                Skyload.setLog('TT', 'Get video error', e);
                                            });
                                        }
                                    } else {
                                        $link.attr(attrId, 'ignore');
                                    }
                                } catch (e) {
                                    $link.attr(attrId, 'error');

                                    Skyload.setLog('TT', 'Parse video error', e);
                                }
                            });
                        }
                    }
                }, Settings.get('delay'));

                return this;
            }
        });
    });
});