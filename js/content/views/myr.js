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

define('MYR', ['APP', 'backbone', 'underscore', 'jquery', 'yandex'], function (Skyload, Backbone, _, $) {
    Skyload.Custodian.Require('MYR', function () {
        var MYR = _.extend({}, SkyloadDefaultComponents);

        MYR.Settings = Backbone.Model.extend({
            defaults: {
                sig: Skyload.SOURCE_YANDEX,
                delay: 1000
            }
        });

        var attrId = 'skyload-' + Skyload.Methods.GetRandStr(5);

        var Settings = new MYR.Settings();
        var SoundCollection = Skyload.Instance.GetInstance(Skyload.TYPE_SOUND, Settings.get('sig'));

        return Skyload.AppView.extend({
            initialize: function initialize() {
                this.init();

                this.parse = true;
                this.parseMainAttr = attrId;
                this.parseElemAttr = attrId + '-index';
                this.parseTypeAttr = attrId + '-type';
                this.parseCountAttr = attrId + '-count';
                this.parseIgnoreAttr = attrId + '-ignore';

                this.listenToOnce(SoundCollection, 'reset', this.render);
                this.parseElem('.slider__item_track[' + attrId + ']', SoundCollection);

                this.checkAccess();
            },
            render: function render() {
                var _this = this;

                setInterval(function () {
                    if (_this.isActive()) {
                        try {
                            var $elem = _this.$el.find('.slider__item_track:not([' + attrId + '])');

                            if ($elem.length) {
                                $elem.each(function (i, elem) {
                                    var $this = $(elem);
                                    var id = $this.find('[data-idx]').data('idx');

                                    if (_.isNumber(id)) {
                                        var index = [Settings.get('sig'), id].join('_');
                                        var model = SoundCollection.get(index);

                                        if (!(model instanceof Backbone.Model)) {
                                            Skyload.Yandex.Get(id).then(function (model) {
                                                return SoundCollection.save(model);
                                            }).catch(function (e) {
                                                Skyload.setLog('Yandex Radio', 'Get/Save sound model error', e);
                                            });
                                        }

                                        _this.markElem($this, [Skyload.TYPE_SOUND, index]);
                                    }
                                });
                            }
                        } catch (e) {
                            Skyload.setLog('Yandex Radio', 'Parse error', e);
                        }
                    }
                }, Settings.get('delay'));

                return this;
            }
        });
    });
});