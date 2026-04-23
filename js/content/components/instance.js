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

define('instance', ['underscore', 'methods'], function (_) {
    var Instance = function () {
        function Instance() {
            _classCallCheck(this, Instance);

            this.self = {};
        }

        _createClass(Instance, [{
            key: 'GetInstance',
            value: function GetInstance(index, source) {
                try {
                    var key = index + '_' + (_.isUndefined(source) ? 'all' : source);
                    var instance = this.self[key];

                    if (_.isUndefined(source)) source = false;

                    if (_.isUndefined(instance)) {
                        var name = Skyload.Methods.FirstUpperCase(index);

                        if (!_.isUndefined(name)) {
                            instance = new Skyload.Collections[name + 'Collection']();
                            instance.setSource(source).update();

                            this.self[key] = instance;
                        } else {
                            throw new Error('Not found');
                        }
                    }
                } catch (e) {
                    Skyload.setLog('Instance', 'Error', e);
                    return false;
                }

                return instance;
            }
        }]);

        return Instance;
    }();

    if (!('Instance' in Skyload)) {
        Skyload.Instance = new Instance();
    }

    return Instance;
});