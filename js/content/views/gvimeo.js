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

define('GVIMEO', ['APP', 'backbone', 'underscore', 'url_video_parser', 'vimeo'], function (Skyload, Backbone, _, urlVideoParser) {
    Skyload.Custodian.Require('GVIMEO', function () {
        var GVimeo = _.extend({}, SkyloadDefaultComponents);

        GVimeo.Settings = Backbone.Model.extend({
            defaults: {
                sig: Skyload.SOURCE_VIMEO,
                delay: 1000
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new GVimeo.Settings();
        var VideoCollection = Skyload.Instance.GetInstance(Skyload.TYPE_VIDEO, Settings.get('sig'));

        GVimeo.Views.Button = Backbone.View.extend({
            tagName: 'div',
            className: 'box vimeo-download-button',
            template: _.template('<label class="rounded-box download-label invisible hidden" role="presentation" hidden="">' + '<span>Download</span>' + '</label>' + '<button tabindex="50" class="download-button rounded-box" aria-label="Download">' + '<span class="download-icon"></span>' + '</button>'),
            events: {
                'mouseenter button': 'showTooltip',
                'mouseleave': 'hideTooltip'
            },
            render: function render() {
                var list = new GVimeo.Views.List({
                    model: this.model,
                    collection: this.model.getVideo()
                });

                this.$el.html(this.template()).find('.download-label').html(list.render().el);

                return this;
            },
            showTooltip: function showTooltip() {
                this.$el.find('.download-label').removeClass('hidden invisible').addClass('visible').removeAttr('hidden');
            },
            hideTooltip: function hideTooltip() {
                this.$el.find('.download-label').removeClass('visible').addClass('invisible hidden').attr('hidden', 'hidden');
            }
        });

        GVimeo.Views.List = Backbone.View.extend({
            tagName: 'span',
            render: function render() {
                var _this = this;

                this.$el.text(Skyload.getLocale('download') + ' - ');
                this.collection.sortByField('index').each(function (model) {
                    var item = new GVimeo.Views.ListItem({ model: _this.model });
                    _this.$el.append(item.render(model).el);
                });

                return this;
            }
        });

        GVimeo.Views.ListItem = Skyload.VideoView.extend({
            tagName: 'a',
            events: {
                'click': 'downloadVideo'
            },
            render: function render(model) {
                this.specialModel = model;

                this.$el.text(this.specialModel.get('quality')).attr({
                    href: this.specialModel.get('url'),
                    download: this.getFileName(),
                    title: Skyload.getLocale('download_video') + ' - ' + this.getTitle()
                });

                return this;
            },
            downloadVideo: function downloadVideo(e) {
                e.preventDefault();
                this.download('GlobalVimeo');
            }
        });

        return Skyload.AppView.extend({
            lock: false,
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
                        if (!_.isNull(_this2.id) || !_this2.isActive()) {
                            return;
                        }

                        var parse = urlVideoParser.parse(location.href);

                        if (!_.isObject(parse) || parse.provider !== 'vimeo') {
                            return;
                        }

                        var id = parse.id;


                        var $elem = _this2.$el.find('.vp-sidedock:not([' + attrId + '])');
                        var index = [Settings.get('sig'), id].join('_');
                        var model = VideoCollection.get(index);

                        if ($elem.length && id !== _this2.id) {
                            if (model instanceof Backbone.Model && model.isCached()) {
                                model.set('view', $elem);

                                _this2.setVideoTemplate(model);
                            } else {
                                _this2.lock = true;

                                Skyload.Vimeo.Get(id).then(function (model) {
                                    return VideoCollection.save(model);
                                }).then(function (model) {
                                    model.set('view', $elem);
                                    _this2.setVideoTemplate(model);
                                }).catch(function (e) {
                                    Skyload.setLog('Global Vimeo', 'Error', e);
                                    Skyload.Analytics('Vimeo', 'Error', 'G ID : ' + id + ' ' + e.message);
                                });
                            }

                            _this2.id = id;
                        }
                    } catch (e) {
                        Skyload.setLog('Global Vimeo', 'Parse error', e);
                    }
                }, Settings.get('delay'));

                return this;
            },
            setVideoTemplate: function setVideoTemplate(model) {
                var $toolbar = model.get('view');

                if ($toolbar.length) {
                    var button = new GVimeo.Views.Button({ model: model });
                    $toolbar.append(button.render(this).el);

                    this.markElem($toolbar, model);
                    clearInterval(this.interval);
                }

                this.lock = false;

                Skyload.Analytics('Vimeo', 'View', model.get('id'));

                return this;
            }
        });
    });
});