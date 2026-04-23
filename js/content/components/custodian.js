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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define('custodian', ['underscore'], function (_) {
    var Custodian = function () {
        function Custodian() {
            var _this = this;

            _classCallCheck(this, Custodian);

            this.instance = {};
            this.sender = null;

            Skyload.Methods.GetSender().then(function (sender) {
                _this.sender = sender;
            }).catch(function (e) {
                Skyload.setLog('Custodian', 'Error sender', e);
            });
        }

        _createClass(Custodian, [{
            key: 'Require',
            value: function Require(resource, callback, analytics) {
                if (_.isUndefined(analytics)) {
                    analytics = true;
                }

                if (_.isFunction(callback)) {
                    var instance = callback();

                    if (_.isFunction(instance)) {
                        this.instance[resource] = new instance();

                        if (analytics) {
                            Skyload.Analytics('Custodian', 'Instance', resource);
                        }
                    }
                }

                return this;
            }
        }, {
            key: 'HasInstance',
            value: function HasInstance(resource) {
                return resource in this.instance;
            }
        }, {
            key: 'GetInstance',
            value: function GetInstance(resource) {
                if (this.HasInstance(resource)) {
                    return this.instance[resource];
                }

                return null;
            }
        }, {
            key: 'SetAccess',
            value: function SetAccess(access) {
                if (_.size(this.instance)) {
                    _.each(this.instance, function (instance) {
                        instance.setAccess(access);
                    }, this);
                }

                return this;
            }
        }, {
            key: 'HasParse',
            value: function HasParse() {
                var has = false;

                if (_.size(this.instance)) {
                    _.each(this.instance, function (instance) {
                        if (instance.isParse()) {
                            has = true;
                            return false;
                        }
                    }, this);
                }

                return has;
            }
        }, {
            key: 'GetContentCount',
            value: function GetContentCount() {
                var count = 0;

                if (_.size(this.instance)) {
                    _.each(this.instance, function (instance) {
                        if (instance.isParse()) {
                            count += instance.getContentCount();
                        }
                    }, this);
                }

                return count;
            }
        }, {
            key: 'GetContent',
            value: function GetContent() {
                var _this2 = this;

                return new Promise(function (resolve) {
                    var list = [];

                    if (_.size(_this2.instance)) {
                        var instances = _.filter(_this2.instance, function (instance) {
                            return instance.isParse();
                        });
                        var callback = _.after(_.size(instances), function () {
                            return resolve(list);
                        });

                        _.each(instances, function (instance) {
                            instance.getContent().then(function (data) {
                                if (_.isArray(data.collection)) {
                                    list = list.concat(data.collection);
                                }

                                callback();
                            }, function (e) {
                                Skyload.setLog('Custodian', 'Get content', e);
                                callback();
                            });
                        }, _this2);
                    }
                });
            }
        }]);

        return Custodian;
    }();

    if (!('Custodian' in Skyload)) {
        Skyload.Custodian = new Custodian();
    }

    return Custodian;
});