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

define('checkbox_interface_view', ['checkbox_view', 'underscore', 'common'], function (CheckBoxView, _) {
    return CheckBoxView.extend({
        type: null,
        setType: function setType(type) {
            this.type = type;
            return this;
        },
        setLocale: function setLocale(locales) {
            locales = _.extend(locales, { by: Skyload.getLocale('for') });
            locales = [locales.type, locales.by, locales.domain].join(' ');

            return this.setLabel(locales);
        },
        onCheck: function onCheck() {
            var _this = this;

            if (_.indexOf(Skyload.AvailableTypes, this.type) >= 0) {
                var domain = Skyload.App.getModel().getDomain();
                var json = { domain: domain };
                json[this.type] = this.isChecked();

                var save = function save() {
                    return new Promise(function (resolve) {
                        Skyload.SendMessageFromPopupActionToBackground({
                            method: 'cache',
                            action: 'set',
                            type: 'model',
                            namespace: Skyload.COLLECTION_TYPE_ACCESS,
                            json: json
                        }, resolve);
                    });
                };

                var find = function find() {
                    return new Promise(function (resolve) {
                        Skyload.SendMessageFromPopupActionToBackground({
                            method: 'access',
                            action: 'get',
                            domain: domain
                        }, resolve);
                    });
                };

                save().then(function () {
                    return find();
                }).then(function (model) {
                    Skyload.App.getModel().setAccess(model);

                    Skyload.SendRequest({
                        method: 'access',
                        access: model
                    });

                    Skyload.Analytics('Access', [_this.type, _this.isChecked() ? 'show' : 'hide'].join(':'), domain);
                }).catch(function (e) {
                    Skyload.setLog('Checkbox interface view', 'Save access error', e);
                });
            }

            return this;
        }
    });
});