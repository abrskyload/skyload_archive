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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define('VK', ['APP', 'backbone', 'underscore', 'jquery', 'vk'], function (Skyload, Backbone, _, $) {
    Skyload.Custodian.Require('VK', function () {
        var win = undefined;
        var VK = _.extend({
            TYPE_VIDEO_PARSE_SELF: 'self',
            TYPE_VIDEO_PARSE_EXTERNAL: 'external'
        }, SkyloadDefaultComponents);

        VK.Settings = Backbone.Model.extend({
            defaults: {
                delay: 300,
                sig: Skyload.SOURCE_VK
            },
            clear: function clear(str) {
                return str.replace(/<(?:.|\n)*?>/gm, '').trim();
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new VK.Settings();

        var SoundCollection = Skyload.Instance.GetInstance(Skyload.TYPE_SOUND, Settings.get('sig'));
        var VideoCollection = Skyload.Instance.GetInstance(Skyload.TYPE_VIDEO);

        VK.Views.SoundDownloadButton = Skyload.SoundView.extend({
            tagName: 'div',
            className: 'vk-sound__download',
            events: {
                'click': 'downloadSound',
                'mouseover .vk-sound__download__button': 'showTooltip'
            },
            initialize: function initialize() {
                this.listenTo(this.model, 'change:size', this.setTitle);
            },
            render: function render() {
                this.$icon = $('<div />').addClass('vk-sound__download__button');

                this.$el.attr('id', attrId + '-sound-' + this.model.get('index')).attr('onclick', 'event.cancelBubble=true;').html(this.$icon);

                if (this.model.get('size') > 0) {
                    this.setTitle();
                }

                return this;
            },
            setTitle: function setTitle() {
                if (this.$icon) {
                    this.$icon.attr({
                        'area-label': this.getTitle()
                    });
                }

                return this;
            },
            showTooltip: function showTooltip(e) {
                var id = attrId + '-sound-' + this.model.get('index');

                var code = 'function(){' + 'var button = document.getElementById("' + id + '");' + 'var icon = button && button.getElementsByClassName("vk-sound__download__button")[0];' + 'icon && showTooltip(icon, {text:icon.getAttribute("area-label"),className:"ttb",black:true,needLeft:true});' + '}';

                Skyload.Methods.B(code);
            },
            downloadSound: function downloadSound(e) {
                e.preventDefault();
                e.cancelBubble = true;
                this.download('VK');
            }
        });

        VK.Views.VideoList = Backbone.View.extend({
            tagName: 'div',
            className: 'vk-video__dropdown like_btn download ui_actions_menu_wrap _ui_menu_wrap ui_actions_menu_top',
            template: _.template('<div class="like_button_icon"></div>' + '<div class="like_button_label"><%= download %></div>' + '<div class="blind_label"><%= download %></div>' + '<div class="ui_actions_menu _ui_menu"></div>'),
            events: {
                'mouseenter .idd_selected_value': 'hover',
                'mouseenter .idd_popup': 'hover',
                'mouseleave': 'hover',
                'mouseover': 'showPopup',
                'mouseout': 'hidePopup'
            },
            delay: null,
            popupShow: false,
            render: function render() {
                var _this = this;

                var sort = 'format';

                this.$el.before('<div class="mv_rtl_divider fl_l"></div>');

                this.$el.html(this.template({
                    download: Skyload.getLocale('download_video')
                })).attr('id', attrId + '-video-' + this.model.get('index'));

                switch (this.model.get('source')) {
                    case Skyload.SOURCE_VK:
                        sort = 'size';
                        break;
                    case Skyload.SOURCE_VIMEO:
                        sort = 'index';
                        break;
                }

                this.model.getVideo().sortByField(sort).each(function (video) {
                    if (video.get('without_audio')) {
                        return;
                    }

                    _this.$el.find('.ui_actions_menu').append(new VK.Views.VideoListItem({
                        model: _this.model
                    }).render(video).el);
                });

                return this;
            },
            hover: function hover(e) {
                var _this2 = this;

                var $popup = this.$el.find('#idd_mv_download');
                var $button = $('#mv_download');

                if (!_.isNull(this.delay)) {
                    clearTimeout(this.delay);
                }

                if (e.type == 'mouseenter') {
                    var buttonTop = parseFloat($button.offset().top);
                    var popupHeight = parseFloat($popup.outerHeight());
                    var buttonPos = $button.data('pos');
                    var bodyTop = parseFloat($('body').scrollTop());
                    var bodyHeight = parseFloat($(win).height());

                    var pos = buttonTop + popupHeight < bodyTop + bodyHeight ? 'bottom' : 'top';

                    if (pos != buttonPos) {
                        this.$el.find('.idd_header_wrap')[pos == 'top' ? 'appendTo' : 'prependTo']('#idd_mv_download');
                    }

                    $popup.css({
                        display: 'block',
                        left: -10,
                        top: pos == 'top' ? -(popupHeight - 31) : 0
                    }).stop().animate({ opacity: 1 }, 100);

                    $button.data('pos', pos);
                } else {
                    this.delay = setTimeout(function () {
                        $popup.stop().animate({ opacity: 0 }, 100, function () {
                            $popup.hide();
                            clearTimeout(_this2.delay);
                        });
                    }, 1000);
                }
            },
            showPopup: function showPopup() {
                if (this.popupShow) {
                    return;
                }

                this.popupShow = true;

                var id = attrId + '-video-' + this.model.get('index');

                var code = 'function(){' + 'uiActionsMenu.show(document.getElementById("' + id + '"), new Event("mouseover"), {autopos: true, dy: 6});' + '}';

                Skyload.Methods.B(code);
            },
            hidePopup: function hidePopup() {
                this.popupShow = false;

                var id = attrId + '-video-' + this.model.get('index');

                var code = 'function(){' + 'uiActionsMenu.hide(document.getElementById("' + id + '"));' + '}';

                Skyload.Methods.B(code);
            }
        });

        VK.Views.VideoListItem = Skyload.VideoView.extend({
            tagName: 'div',
            className: 'ui_actions_menu_item',
            template: _.template('<%= value %>'),
            events: {
                'click': 'downloadVideo',
                'mouseenter': 'hover',
                'mouseleave': 'hover'
            },
            render: function render(model) {
                var _this3 = this;

                if (!(this.specialModel instanceof Backbone.Model)) {
                    this.listenTo(model, 'change:size', function (model) {
                        _this3.render(model);
                    });
                }

                this.specialModel = model;

                var template_format = _.template('<b><%= format %></b> (<%= quality %>)');
                var template_size = _.template(' ~ <%= size %>');

                this.$el.html(this.template({
                    value: template_format({
                        format: model.get('format'),
                        quality: model.get('quality')
                    }) + template_size({
                        size: this.getSizeTitle()
                    })
                }));

                return this;
            },
            downloadVideo: function downloadVideo(e) {

                this.download('VK', 'Download video via dropdown');

                return false;
            },
            hover: function hover(e) {
                this.$el[e.type === 'mouseenter' ? 'addClass' : 'removeClass']('idd_hover');
            }
        });

        return Skyload.AppView.extend({
            events: _defineProperty({}, 'mouseenter .audio_row[' + attrId + '=mod]:not(.audio_claimed):not(.audio_deleted)', 'renderSoundMeta'),
            initialize: function initialize() {
                this.init();
                this.parse = this;
                this.currentVideo = null;
                this.detectVideo = false;

                this.parseMainAttr = attrId;
                this.parseElemAttr = attrId + '-index';
                this.parseTypeAttr = attrId + '-type';
                this.parseCountAttr = attrId + '-count';
                this.parseIgnoreAttr = attrId + '-ignore';

                SoundCollection.autoSave();

                var render = _.after(2, this.render);

                this.listenToOnce(SoundCollection, 'reset', render);
                this.listenToOnce(VideoCollection, 'reset', render);

                this.checkAccess();

                Skyload.VK.GetUserId().then(function (user_id) {
                    Skyload.SendMessageFromContentToBackground({
                        method: 'set_libs_default',
                        source: Settings.get('sig'),
                        user_id: user_id
                    });
                }).catch(function (e) {
                    Skyload.setLog('VK', 'Fetch user id error', e);
                });
            },
            render: function render() {
                var _this4 = this;

                this.parseElem('.audio_row[' + attrId + ']:not([' + attrId + '=error]),[' + attrId + '-type=video]', [SoundCollection, VideoCollection]);

                setInterval(function () {
                    if (_this4.isActive()) {
                        _this4.renderSound().renderVideo();

                        if (!_this4.getContentCount(Skyload.TYPE_VIDEO) && _this4.detectVideo) {
                            _this4.detectVideo = false;

                            _this4.clearParseContent().catch(function (e) {
                                Skyload.setLog('VK', 'Clear parse content error', e);
                            });
                        }
                    }
                }, Settings.get('delay'));

                return this;
            },
            renderSound: function renderSound() {
                var _this5 = this;

                try {
                    var $elem = this.$el.find('.audio_row:not([' + attrId + ']):not(.audio_claimed):not(.audio_deleted)');

                    if ($elem.length) {
                        var mark = function mark($this, model) {
                            if (model.get('size')) {
                                $this.attr(attrId + '-size', 'mod');
                            }

                            _this5.markElem($this, model);
                        };

                        $elem.each(function (i, elem) {
                            var $this = $(elem);

                            try {
                                var data = $this.data();

                                if (_.isObject(data)) {
                                    var id = data.fullId;

                                    if (!id.length) {
                                        throw new Error('Id is empty');
                                    }

                                    var index = [Settings.get('sig'), id].join('_');
                                    var model = SoundCollection.get(index);

                                    if (model instanceof Backbone.Model && model.isCached()) {
                                        mark($this, model);
                                    } else {
                                        var audioData = Skyload.VK.GetModelFromData(data.audio);

                                        model = _.extend(audioData, {
                                            data: _.extend(audioData.data, {
                                                is_new: true,
                                                id: id
                                            })
                                        });

                                        model = SoundCollection.add(model);
                                        mark($this, model);

                                        $this.attr(_this5.parseElemAttr, index).attr(attrId, 'set');
                                    }
                                } else {
                                    throw new Error('Data not object');
                                }
                            } catch (e) {
                                $this.attr(attrId, 'error');
                                Skyload.setLog('VK', 'Parse sound block error', e);
                            }
                        });
                    }

                    this.renderTemplate('.audio_row:not([' + attrId + '=mod]):not([' + attrId + '=error])', SoundCollection);
                } catch (e) {
                    Skyload.setLog('VK', 'Render sound', e);
                }

                return this;
            },
            renderVideo: function renderVideo() {
                var _this6 = this;

                try {
                    var type = VK.TYPE_VIDEO_PARSE_SELF;
                    var $videos = this.$el.find('[id^=video_box_wrap]');

                    if (!$videos.length) {
                        type = VK.TYPE_VIDEO_PARSE_EXTERNAL;
                        $videos = this.$el.find('#mv_player_box iframe:not([' + attrId + '])');
                    }

                    if ($videos.length) {
                        $videos.each(function (i, elem) {
                            var $elem = $(elem);
                            var id = void 0,
                                source = void 0,
                                data = void 0,
                                model = void 0,
                                src = void 0;

                            switch (type) {
                                case VK.TYPE_VIDEO_PARSE_SELF:
                                    id = $elem.attr('id').split('video_box_wrap')[1];

                                    if (id) {
                                        if ($elem.attr(attrId + '-video-id') !== id) {
                                            $elem.attr(attrId + '-video-id', id);
                                            source = Settings.get('sig');
                                        }
                                    }

                                    break;
                                case VK.TYPE_VIDEO_PARSE_EXTERNAL:
                                    src = $elem.attr('src');

                                    if (_.isString(src) && src.length) {
                                        if (src.indexOf('youtube.com/embed') >= 0 && Skyload.IsAvailableResource(Skyload.SOURCE_YOUTUBE)) {
                                            id = _.compact(Skyload.Methods.ParseURL(src).path.split('/')).slice(-1)[0];
                                            source = Skyload.SOURCE_YOUTUBE;
                                        } else if (src.indexOf('player.vimeo.com/video') >= 0 && Skyload.IsAvailableResource(Skyload.SOURCE_VIMEO)) {
                                            id = _.chain(Skyload.Methods.ParseURL(src).path.split('/')).compact().last().value();
                                            source = Skyload.SOURCE_VIMEO;
                                        }
                                    }

                                    break;
                            }

                            if (id && source) {
                                var index = [source, id].join('_');
                                model = VideoCollection.get(index);

                                if (model instanceof Backbone.Model && model.isCached()) {
                                    model.set('view', $elem);
                                    _this6.setVideoTemplate(model);
                                } else {
                                    $elem.attr(attrId, 'set');
                                    _this6.setVideoPreload(true);

                                    switch (source) {
                                        case Skyload.SOURCE_YOUTUBE:
                                        case Skyload.SOURCE_VIMEO:
                                            var params = [id];

                                            Skyload.CallProcedure(source, params).then(function (model) {
                                                return VideoCollection.save(model, Skyload.COLLECTION_MODE_IGNORE_SIZE);
                                            }).then(function (model) {
                                                model.set('view', $elem);
                                                _this6.setVideoTemplate(model);
                                            }).catch(function (error) {
                                                _this6.setVideoPreload(false);
                                                Skyload.setLog('VK', 'Get bridge video error', source, error);
                                            });

                                            break;
                                        case Skyload.SOURCE_VK:
                                            var list = void 0,
                                                playlist_id = void 0;
                                            var href = Skyload.parseURL(location.href);

                                            if ('query' in href) {
                                                var videoDataParam = Skyload.Methods.GetQueryVariable(href.query, 'z');

                                                if (videoDataParam) {
                                                    videoDataParam = videoDataParam.split('/');

                                                    if (videoDataParam.length) {
                                                        if (videoDataParam[1]) {
                                                            list = videoDataParam[1];
                                                        }

                                                        if (videoDataParam[2]) {
                                                            playlist_id = videoDataParam[2].replace('pl_', '');
                                                        }
                                                    }
                                                }
                                            }

                                            Skyload.VK.FetchVideo(id, list, playlist_id).then(function (data) {
                                                var video = Skyload.VK.GetVideoModelFromData(data);

                                                return VideoCollection.save(video, Skyload.COLLECTION_MODE_IGNORE_SIZE).then(function (model) {
                                                    model.set('view', $elem);
                                                    _this6.setVideoTemplate(model);

                                                    return data;
                                                }).catch(function () {
                                                    return data;
                                                });
                                            }).then(function (data) {
                                                return Skyload.VK.GetStreamVideoFromData(data).then(function (videos) {
                                                    _.each(videos, function (video) {
                                                        Skyload.SendMessageFromContentToBackground({
                                                            method: 'parse_request',
                                                            file: _.extend(video, {
                                                                responseHeaders: [{
                                                                    name: 'content-type',
                                                                    value: Skyload.VIDEO_MIME_TYPE_STREAM_MPEG
                                                                }]
                                                            })
                                                        }, function (_ref) {
                                                            var code = _ref.code,
                                                                message = _ref.message;

                                                            if (code === 1) {
                                                                Skyload.setLog('VK', 'Parse request video stream error', message);
                                                            }
                                                        });
                                                    });
                                                });
                                            }).catch(function (error) {
                                                _this6.setVideoPreload(false);
                                                Skyload.setLog('VK', 'Get VK video error', error);
                                            });

                                            break;
                                        default:
                                            _this6.setVideoPreload(false);

                                            break;
                                    }
                                }
                            }
                        });
                    }
                } catch (e) {
                    Skyload.setLog('VK', 'Render video', e);
                }

                return this;
            },
            _setSoundTemplate: function _setSoundTemplate(model, $elem, i) {
                var _this7 = this;

                var max = 50;
                var now = _.isNumber(i) ? i : 1;

                if (!this.setSoundTemplate(model) && now < max) {
                    setTimeout(function () {
                        _this7._setSoundTemplate(model, $elem, now + 1);
                    }, 50);
                }
            },
            setSoundTemplate: function setSoundTemplate(model) {
                var $this = model.get('view');

                if ($this.length) {
                    var $button = $this.find('.vk-sound__download');
                    $this.attr(attrId, 'mod');

                    if (!$button.length) {
                        var view = new VK.Views.SoundDownloadButton({ model: model });
                        $this.find('.audio_row__actions').prepend(view.render().el);
                    }

                    $button = $this.find('.vk-sound__download');

                    return $button.length > 0;
                }

                return false;
            },
            setVideoTemplate: function setVideoTemplate(model) {
                var $this = model.get('view');
                var $wrapper = $this.parents('#mv_box');

                if ($wrapper.length) {
                    var $buttons = $wrapper.find('.mv_actions_block .like_btns');

                    if ($buttons) {
                        var view = new VK.Views.VideoList({ model: model });
                        $buttons.append(view.render().el);
                    }
                }

                this.markElem($this, model).setVideoPreload(false);

                if (_.include([Skyload.SOURCE_YOUTUBE, Skyload.SOURCE_VIMEO], model.get('source'))) {
                    $this.attr(this.parseIgnoreAttr, 1);
                }

                this.currentVideo = model;
                this.detectVideo = true;
            },
            setActionSound: function setActionSound(collection) {
                return new Promise(function (resolve) {
                    var limit = 10;

                    var j = 0,
                        models = [],
                        callback = _.after(collection.length, function () {
                        resolve({
                            collection: collection,
                            type: Skyload.TYPE_SOUND
                        });
                    });

                    _.each(collection, function (model, i, list) {
                        list[i] = {
                            id: model.get('index'),
                            download_id: model.get('download_id'),
                            index: model.get('index'),
                            source: model.get('source'),
                            type: model.getType(),
                            cover: model.get('cover'),
                            title: model.getName(),
                            file: model.get('play'),
                            mime_type: model.get('mime_type'),
                            duration: model.get('duration'),
                            data: model.get('data')
                        };

                        if (model.get('size') > 0) {
                            list[i].size = model.get('size');
                        } else if (j <= limit) {
                            if (Skyload.isURL(model.get('play'))) {
                                model.getSize().catch(function (e) {
                                    Skyload.setLog('VK', 'Set action sound', 'Get size', e);
                                });
                            } else {
                                models.push(model);
                            }

                            j++;
                        }

                        callback();
                    });

                    if (models.length) {
                        var ids = models.map(function (model) {
                            return model.get('data').download_id;
                        });

                        Skyload.VK.GetCollection(ids).then(function (collection) {
                            SoundCollection.set(collection, { remove: false });
                        }).catch(function (e) {
                            Skyload.setLog('VK', 'Set action sound', 'Get collection', e);
                        });
                    }
                });
            },
            renderSoundMeta: function renderSoundMeta(e) {
                var $this = $(e.currentTarget);

                if ($this.length) {
                    var index = $this.attr(this.parseElemAttr);
                    var model = SoundCollection.get(index);

                    if (model instanceof Backbone.Model) {
                        var size = $this.attr(attrId + '-size');

                        if (size != 'mod') {
                            $this.attr(attrId + '-size', 'mod');

                            if (Skyload.isURL(model.get('play'))) {
                                model.getSize().catch(function (e) {
                                    Skyload.setLog('VK', 'Get sound size error', e);
                                });
                            } else {
                                Skyload.VK.Get(model.get('data').download_id).then(function (_model) {
                                    return model.set('play', _model.play);
                                }).then(function () {
                                    return model.getSize();
                                }).catch(function (e) {
                                    Skyload.setLog('VK', 'Get update sound size error', e);
                                });
                            }
                        }

                        this._setSoundTemplate(model, $this);
                    }
                }

                return this;
            },
            findVideoInfo: function findVideoInfo() {
                var _this8 = this;

                return new Promise(function (resolve, reject) {
                    try {
                        if (!(_this8.currentVideo instanceof Backbone.Model)) {
                            throw new Error('Current video not set');
                        }

                        resolve(_this8.currentVideo.getJSON());
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        });
    });
});