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

define('sidebar_view', ['checkbox_interface_view', 'checkbox_group_view', 'backbone', 'underscore', 'jquery', 'methods', 'chart', 'progress', 'common'], function (CheckboxInterfaceView, CheckboxGroupView, Backbone, _, $) {
    return Backbone.View.extend({
        tagName: 'aside',

        className: 'l-sidebar',
        downloadInformerHideClassName: 'm-download-informer-hide',

        template: _.template($('#template-sidebar').html()),
        countItemTemplate: _.template($('#template-content-info-item').html()),

        downloading: false,

        events: {
            'click .js-logo': 'goToSite',
            'click .js-menu-open': 'menuOpen',
            'click .js-button-multiupload': 'switchSelectedMode',
            'click .js-button-multiupload-cancel': 'switchSelectedMode',
            'click .js-button-multiupload-download:not(.b-button-inactive)': 'downloadSelected',
            'click .js-button-select-all:not(.b-button-selected)': 'selectAll',
            'click .js-button-select-several:not(.b-button-selected)': 'selectSeveral',
            'click .js-download-informer-panel': 'switchDownloadMode',
            'click .js-button-download-back': 'switchDownloadMode',
            'click .js-download-informer-cancel': 'cancelDownload',
            'click .js-button-download-cancel': 'cancelDownload'
        },
        initialize: function initialize() {
            var _this = this;

            this.listenTo(this.model, 'update_collection', function () {
                _this.renderChart();
            });

            this.listenTo(this.model, 'update_access', _.debounce(function () {
                _this.renderAccessCheckboxes();
            }, 200));

            this.listenTo(this.model, 'select_model', _.debounce(function () {
                _this.autoSwitchButtonsSelectedType();
                _this.updateSelectedInfo();
            }, 200));

            this.listenTo(this.model, 'cancel_download', function () {
                _this.$downloadInformer.addClass(_this.downloadInformerHideClassName);

                if (Skyload.App.isDownloadTemplate()) {
                    _this.$downloadProgress.data('easyPieChart').update(0);

                    _this.$downloadCancelButton.hide();
                    _this.$downloadCount.text(0);
                    _this.$downloadQueueCount.text(0);
                    _this.$downloadCountType.text(Skyload.getCountLocaleByType(0, Skyload.TYPE_MIXED, Skyload.LOCALE_STYLE_LOWER_CASE));
                    _this.$downloadQueueCountType.text(Skyload.getCountLocaleByType(0, Skyload.TYPE_MIXED, Skyload.LOCALE_STYLE_LOWER_CASE));
                }
            });

            this.listenTo(this.model, 'change:download_percent', function (model, percent) {
                if (Skyload.App.isDownloadMode()) {
                    _this.$downloadProgress.data('easyPieChart').update(percent);
                } else {
                    _this.$downloadInformerStatus.text(_.template('<%= count %> <%= label %> - <%= percentage %>%')({
                        count: model.get('download_count'),
                        label: Skyload.getCountLocaleByType(model.get('download_count'), model.get('download_type'), Skyload.LOCALE_STYLE_LOWER_CASE),
                        percentage: percent
                    }));

                    _this.$downloadInformerProgressBar.css('width', percent + '%');
                }
            });

            this.listenTo(this.model, 'change:download_count change:download_type change:download_queue_count', function (model) {
                var count = parseInt(model.get('download_count')) - parseInt(model.get('download_queue_count'));

                if (_.isNaN(count) || !_.isNumber(count) || count < 0) {
                    count = model.get('download_count');
                }

                _this.$downloadCount.text(count);
                _this.$downloadCountType.text(Skyload.getCountLocaleByType(count, model.get('download_type'), Skyload.LOCALE_STYLE_LOWER_CASE));
            });

            this.listenTo(this.model, 'change:download_queue_count', function (model, count) {
                _this.$downloadQueueCount.text(count);
            });

            this.listenTo(this.model, 'change:download_queue_count change:download_queue_type', function (model) {
                _this.$downloadQueueCountType.text(Skyload.getCountLocaleByType(model.get('download_queue_count'), model.get('download_queue_type'), Skyload.LOCALE_STYLE_LOWER_CASE));
            });

            this.listenTo(this.model, 'change:downloading', function (model, downloading) {
                _this.$downloadInformer[downloading ? 'removeClass' : 'addClass'](_this.downloadInformerHideClassName);

                if (downloading) {
                    _this.$downloadCancelButton.show();
                }
            });
        },
        render: function render() {
            var _this2 = this;

            this.$el.html(this.template());

            this.$el.find('.js-multiupload-separate').html(new CheckboxGroupView().render().el);

            this.$chart = this.$el.find('.js-chart').data('render', false);
            this.$counts = this.$el.find('.js-counts');
            this.$buttonsSelectedType = this.$el.find('.b-button-group > .b-button-group__button');
            this.$selectedCount = this.$el.find('.js-multiupload-selected-count');
            this.$selectedType = this.$el.find('.js-multiupload-selected-type');
            this.$selectedSize = this.$el.find('.js-multiupload-size');
            this.$selectedTypeSize = this.$el.find('.js-multiupload-size-type');
            this.$downloadProgress = this.$el.find('.js-download-progress');
            this.$downloadCount = this.$el.find('.js-download-count');
            this.$downloadCountType = this.$el.find('.js-download-count-type');
            this.$downloadQueueCount = this.$el.find('.js-download-queue-count');
            this.$downloadQueueCountType = this.$el.find('.js-download-queue-count-type');
            this.$downloadSelectedButton = this.$el.find('.js-button-multiupload-download');
            this.$downloadCancelButton = this.$el.find('.js-button-download-cancel');
            this.$downloadInformer = this.$el.find('.js-download-informer');
            this.$downloadInformerStatus = this.$el.find('.js-download-informer-status');
            this.$downloadInformerProgressBar = this.$el.find('.js-download-informer-progress-bar');
            this.$interfaceAccess = this.$el.find('.js-interface-access').data('render', false);

            Skyload.App.getContent().on('close_search search', function () {
                _this2.autoSwitchButtonsSelectedType();
            });

            this.$downloadProgress.easyPieChart({
                size: 100,
                trackColor: 'rgba(140, 167, 191, 0.2)',
                onStep: function onStep(start, end, step) {
                    _this2.$el.find('.js-download-progress-label').text(parseInt(step));
                }
            });

            return this;
        },
        getCurrentCollection: function getCurrentCollection() {
            if (Skyload.App.getContent().isSearchMode()) {
                return this.model.getSearchCollection(Skyload.App.getContent().getTerm());
            } else {
                return this.model.getCollection();
            }
        },
        renderChart: function renderChart() {
            var _this3 = this;

            var render = this.$chart.data('render') || false;
            var colors = ['rgba(25, 136, 224, 0.7)', 'rgb(133, 204, 63)'];
            var count = this.model.getCollectionCount();
            var data = _.chain(Skyload.AvailableTypes).map(function (type) {
                return {
                    type: type,
                    title: Skyload.getLocale(type),
                    value: _this3.model['get' + Skyload.Methods.FirstUpperCase(type) + 'Count']()
                };
            }).filter(function (item) {
                return item.value > 0;
            }).compact().map(function (item, i) {
                item.color = colors[i];
                return item;
            }).value();

            if (render) {
                this.$chart.html('');
                this.$counts.html('');
            }

            this.$chart.data('render', true).css({
                width: 120,
                height: 120
            }).drawDoughnutChart(data, {
                tipClass: 'b-chart__tooltip',
                summaryClass: 'b-chart__summary',
                summaryTitleClass: 'b-chart__title',
                summaryNumberClass: 'b-chart__number',
                summaryTitle: Skyload.getCountLocale(count, ['file', 'file_2', 'files']),
                percentageInnerCutout: 90,
                segmentStrokeColor: 'rgb(242, 242, 242)',
                baseColor: 'rgba(140, 167, 191, 0.2)',
                baseOffset: 2,
                showTip: false,
                animationSteps: 110,
                animation: !render
            });

            _.each(data, function (item) {
                _this3.$counts.append(_this3.countItemTemplate(item));
            });

            return this;
        },
        renderAccessCheckboxes: function renderAccessCheckboxes() {
            var _this4 = this;

            var types = this.model.getAvailableTypes();
            var render = this.$interfaceAccess.data('render') || false;

            _.each(Skyload.AvailableTypes, function (type) {
                if (!render) {
                    var checkbox = new CheckboxInterfaceView();

                    checkbox.setLocale({
                        type: Skyload.getLocale(type),
                        domain: _this4.model.getDomain()
                    }).setType(type).active(_this4.model.get('access_' + type));

                    checkbox.render().$el.addClass('b-checkbox-access b-checkbox-' + type);

                    _this4.$interfaceAccess.append(checkbox.el);
                }

                _this4.$interfaceAccess[_.contains(types, type) || !types.length ? 'addClass' : 'removeClass']('m-access-' + type);
            });

            this.$interfaceAccess.data('render', true);

            return this;
        },
        updateSelectedInfo: function updateSelectedInfo() {
            var collection = this.model.getCollection().chain().filter(function (model) {
                return model.get('selected');
            });

            var type = void 0,
                size = collection.reduce(function (memo, model) {
                return memo + model.get('size');
            }, 0).value(),
                count = collection.value().length,
                types = collection.groupBy(function (model) {
                return model.get('type');
            }).keys().value();

            var info = Skyload.Methods.ConvertMediaInfo(size);

            type = Skyload.getCountLocaleByType(count, types.length == 1 ? _.first(types) : Skyload.TYPE_MIXED);

            this.$downloadSelectedButton[count ? 'removeClass' : 'addClass']('b-button-inactive');

            this.$selectedCount.text(count);
            this.$selectedType.text(type);
            this.$selectedSize.text(info.size);
            this.$selectedTypeSize.text(Skyload.getLocale(info.value));

            return this;
        },
        selectAll: function selectAll(e) {
            this.getCurrentCollection().each(function (model) {
                return model.set('selected', true);
            });

            return this.switchButtonsSelectedType(e);
        },
        selectSeveral: function selectSeveral(e) {
            this.getCurrentCollection().each(function (model) {
                return model.set('selected', model.get('user_selected'));
            });

            return this.switchButtonsSelectedType(e);
        },
        switchButtonsSelectedType: function switchButtonsSelectedType(e) {
            var type = _.isString(e) ? e : $(e.currentTarget).data('type') || 'several';
            var selected = 'b-button-selected';

            this.$buttonsSelectedType.removeClass(selected).filter('[data-type=' + type + ']').addClass(selected);

            return this;
        },
        autoSwitchButtonsSelectedType: function autoSwitchButtonsSelectedType() {
            var collection = this.getCurrentCollection();
            var selected = collection.filter(function (model) {
                return model.get('selected');
            }).length;

            return this.switchButtonsSelectedType(collection.length == selected ? 'all' : 'several');
        },
        switchSelectedMode: function switchSelectedMode(e) {
            var mode = !!$(e.currentTarget).data('mode');
            Skyload.App.setSelectedMode(mode);

            return this;
        },
        switchDownloadMode: function switchDownloadMode(e) {
            var mode = !!$(e.currentTarget).data('mode');
            Skyload.App.setDownloadMode(mode);

            return this;
        },
        cancelDownload: function cancelDownload(e) {
            e.stopPropagation();
            this.model.cancelDownload();

            return this;
        },
        downloadSelected: function downloadSelected() {
            this.model.downloadSelected();
            Skyload.App.setSelectedMode(false);

            return this;
        },
        menuOpen: function menuOpen() {
            Skyload.App.getMenu().open();

            return this;
        },
        goToSite: function goToSite() {
            Skyload.App.getMenu().goToSite();
        }
    });
});