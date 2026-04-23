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

define('VIMEO', ['APP', 'backbone', 'underscore', 'jquery', 'url_video_parser', 'vimeo'], function (Skyload, Backbone, _, $, urlVideoParser) {
    Skyload.Custodian.Require('VIMEO', function () {
        var Vimeo = _.extend({}, SkyloadDefaultComponents);

        Vimeo.Settings = Backbone.Model.extend({
            defaults: {
                sig: Skyload.SOURCE_VIMEO,
                loading_class: 'skyload-loading',
                delay: 2000
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new Vimeo.Settings();
        var VideoCollection = Skyload.Instance.GetInstance(Skyload.TYPE_VIDEO, Settings.get('sig'));

        Vimeo.Views.Box = Backbone.View.extend({
            tagName: 'div',
            className: 'clip_info-user_actions vimeo__box-container',
            template: _.template('<div class="vimeo__box-download-icon"><%= download %></div>' + '<div class="vimeo__box-videos js-videos"></div>'),
            render: function render() {
                var _this = this;

                this.$el.html(this.template({ download: Skyload.getLocale('download_video') }));

                this.model.getVideo().sortByField('size').each(function (model) {
                    _this.$el.find('.js-videos').append(new Vimeo.Views.BoxItem({ model: _this.model }).render(model).el);
                });

                return this;
            }
        });

        Vimeo.Views.BoxItem = Skyload.VideoView.extend({
            tagName: 'div',
            className: 'vimeo__box-item',
            template: _.template('<%= format %>(<%= quality %>)'),
            events: {
                'click': 'downloadVideo'
            },
            render: function render(model) {
                this.specialModel = model;

                this.$el.html(this.template({
                    format: this.specialModel.get('format'),
                    quality: this.specialModel.get('quality')
                })).attr('title', this.getTitle());

                return this;
            },
            downloadVideo: function downloadVideo() {
                this.download('Vimeo', 'Box');
            }
        });

        return Skyload.AppView.extend({
            id: null,
            initialize: function initialize() {
                this.init();

                this.parse = true;
                this.parseMainAttr = attrId;
                this.parseElemAttr = attrId + '-index';
                this.parseTypeAttr = attrId + '-type';
                this.parseCountAttr = attrId + '-count';
                this.parseIgnoreAttr = attrId + '-ignore';

                this.listenToOnce(VideoCollection, 'reset', this.render);
                this.parseElem('[' + attrId + '-type=video]', VideoCollection);

                this.checkAccess();
            },
            render: function render() {
                var _this2 = this;

                setInterval(function () {
                    try {
                        if (!_this2.isActive()) {
                            return;
                        }

                        var parse = urlVideoParser.parse(location.href);

                        if (!_.isObject(parse) || parse.provider !== 'vimeo') {
                            return;
                        }

                        var id = parse.id;


                        var $elem = _this2.$el.find('.clip_info-subline--watch').first();
                        var insert = true;

                        if (!$elem.length) {
                            $elem = _this2.$el.find('#wrap');
                            insert = false;
                        }

                        if ($elem.length && id !== _this2.id) {
                            $elem.find('.vimeo__box-container').remove();

                            var index = [Settings.get('sig'), id].join('_');
                            var model = VideoCollection.get(index);

                            _this2.markElem($elem, [Skyload.TYPE_VIDEO, index]);

                            if (model instanceof Backbone.Model && model.isCached()) {
                                model.set('insert', insert).set('view', $elem);

                                _this2.setVideoPreload(false).setVideoTemplate(model);
                            } else {
                                _this2.setVideoPreload(true);

                                Skyload.Vimeo.Get(id).then(function (model) {
                                    return VideoCollection.save(model);
                                }).then(function (model) {
                                    model.set('insert', insert).set('view', $elem);

                                    _this2.setVideoPreload(false).setVideoTemplate(model);
                                }).catch(function (e) {

                                    _this2.setVideoPreload(false);

                                    Skyload.setLog('Vimeo', 'Error', e);
                                    Skyload.Analytics('Vimeo', 'Error', 'ID : ' + id + ' ' + e.message);
                                });
                            }
                        }

                        _this2.id = id;
                    } catch (e) {
                        Skyload.setLog('Vimeo', 'Parse error', e);
                    }
                }, Settings.get('delay'));

                return this;
            },
            setVideoTemplate: function setVideoTemplate(model) {
                var $container = model.get('view');

                this.markElem($container, model);

                if ($container.length && model.get('insert') === true) {
                    $container.append(new Vimeo.Views.Box({ model: model }).render().el);
                    $container.attr(attrId, 'mod');
                }

                Skyload.Analytics('Vimeo', 'View', model.get('id'));

                return this;
            }
        });
    });
});