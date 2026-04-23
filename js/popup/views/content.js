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

define('content_view', ['content_collection', 'content_item_view', 'content_model', 'backbone', 'underscore', 'jquery', 'scrollbar', 'common'], function (ContentCollection, ContentItemView, ContentModel, Backbone, _, $) {
    return Backbone.View.extend({
        tagName: 'div',
        className: 'l-content',
        template: _.template($('#template-content').html()),
        count: 50,
        start: 0,
        lock: false,
        term: null,
        sets: true,
        type: null,
        search_mode: false,
        events: {
            'keyup .js-search-input': 'setSearchContent',
            'click .js-search-close': 'closeSearch',
            'click .js-search-open': 'openSearch'
        },
        getTerm: function getTerm() {
            return this.term;
        },
        setTerm: function setTerm(value) {
            this.term = value;
            return this;
        },
        initialize: function initialize() {
            var _this = this;

            this.listenTo(this.model, 'update_collection', function () {
                _this.setTitle();
                _this.setContent();
            });
            this.listenTo(this.model, 'set_new_collection, update_new_collection', function () {
                _this.start = 0;
                _this.setContent();
            });
        },
        render: function render() {
            var _this2 = this;

            this.$el.html(this.template());
            this.$scrollBar = this.$el.find('.js-scroll-bar');
            this.$contentList = this.$el.find('.js-content-list');
            this.$searchInput = this.$el.find('.js-search-input');
            this.$contentTitle = this.$el.find('.js-content-title');

            this.$scrollBar.scrollBar({
                class_container: 'b-scroll-bar',
                class_scrollbar: 'b-scroll-bar__rail',
                class_track: 'b-scroll-bar__track',
                class_thumb: 'b-scroll-bar__track__thumb',
                class_view_port: 'b-scroll-view-port',
                class_overview: 'b-scroll-view-port__overview',
                class_disable: 'm-scroll-disable',
                class_move: 'm-scroll-move',
                onScroll: _.throttle(function (content, port, scroll) {
                    if (scroll + port * 2 >= content && _this2.sets) {
                        _this2.sets = false;
                        _this2.start += _this2.count;
                        _this2.setContent(scroll).then(function () {
                            _this2.sets = true;
                        });
                    }
                }, 500)
            });

            Skyload.App.on('change_download_mode', function () {
                _this2.start = 0;
                _this2.setContent();
            });

            return this;
        },
        setTitle: function setTitle() {
            var types = this.model.getAvailableTypes();
            var type = Skyload.TYPE_MIXED;

            if (types.length == 1) {
                type = _.first(types);
            }

            if (this.type != type) {
                this.type = type;

                this.$contentTitle.text([Skyload.getLocale(this.type), Skyload.getLocale('on_page')].join(' '));
                this.$searchInput.attr('placeholder', [Skyload.getLocale('search'), Skyload.getLocale(this.type + '_s1'), Skyload.getLocale('on_page')].join(' '));
            }

            return this;
        },
        setDownloadTitle: function setDownloadTitle() {
            this.type = null;
            this.$contentTitle.text(Skyload.getLocale('downloads'));
            this.$searchInput.attr('placeholder', Skyload.getLocale('search_downloads'));

            return this;
        },
        setContent: function setContent(scroll) {
            var _this3 = this;

            return new Promise(function (resolve) {
                var start = _this3.start,
                    end = start + _this3.count;

                if (_.isUndefined(scroll)) {
                    scroll = 0;
                }

                var setter = function setter(collection) {
                    if (collection instanceof ContentCollection) {
                        _this3.setEmpty(start == 0 && !collection.length);

                        var currentCollection = _this3.model.getCurrentCollection();

                        collection.each(function (model) {
                            model.collection = currentCollection;

                            var item = new ContentItemView({ model: model });
                            _this3.$contentList.append(item.setTerm(_this3.term).render().el);
                        });

                        setTimeout(function () {
                            _this3.$scrollBar.scrollBarUpdate(scroll);
                            resolve(collection);
                        }, 10);
                    }
                };

                if (start == 0) {
                    _this3.$contentList.html('');
                }

                if (_this3.model.getCollectionCount() > start) {
                    if (_.isString(_this3.term)) {
                        setter(_this3.model.getSearchCollection(_this3.term, start, end));
                    } else {
                        setter(_this3.model.getSliceCollection(start, end));
                    }
                }
            });
        },
        setSearchContent: function setSearchContent() {
            var _this4 = this;

            return _.debounce(function () {
                _this4.term = _.escape(_this4.$searchInput.val().toString().toLowerCase());
                _this4.start = 0;

                _this4.setContent();
                _this4.trigger('search', _this4.term);
            }, 100)();
        },
        openSearch: function openSearch() {
            this.lock = true;

            this.setSearchMode(true).$searchInput.trigger('focus');

            this.trigger('open_search');

            Skyload.Analytics('SearchOpen');

            return this;
        },
        closeSearch: function closeSearch() {
            if (!Skyload.App.isDownloadMode()) {
                this.lock = false;
            }

            this.term = null;
            this.start = 0;

            this.setSearchMode(false).$searchInput.val("");

            this.setContent();
            this.trigger('close_search');

            Skyload.Analytics('SearchClose');

            return this;
        },
        setLock: function setLock(value) {
            this.lock = !!value;
            return this;
        },
        isLocked: function isLocked() {
            return this.lock;
        },
        setEmpty: function setEmpty(value) {
            this.$el[value ? 'addClass' : 'removeClass']('m-content-empty');
            return this;
        },
        setSearchMode: function setSearchMode(value) {
            this.search_mode = !!value;
            this.$el[this.search_mode ? 'addClass' : 'removeClass']('m-content-search');
            return this;
        },
        isSearchMode: function isSearchMode() {
            return this.search_mode;
        }
    });
});