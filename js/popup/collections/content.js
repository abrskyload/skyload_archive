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

define('content_collection', ['backbone', 'content_item_model', 'common'], function (Backbone, ContentItemModel, Skyload) {
    return Backbone.Collection.extend({
        model: ContentItemModel,
        initialize: function initialize() {
            var _this = this;

            this.each(function (model) {
                if (!model.isValid()) {
                    _this.remove(model);

                    Skyload.Analytics('ModelError', model.validationError);
                    Skyload.setLog('Collection validate', model.get('index'), model.get('name'), model.validationError);
                }
            });
        }
    });
});