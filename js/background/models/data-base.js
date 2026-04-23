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

define('data_base_model', ['config', 'backbone', 'underscore'], function (Config, Backbone, _) {
    var DataModel = Backbone.Model.extend({
        defaults: {
            id: null,
            index: null,
            format: null,
            size: 0,
            site_name: null,
            icon: null,
            link: null,
            stream: false,
            file_source: null,
            download_id: null
        },
        hasFormat: function hasFormat() {
            return _.isString(this.get('format'));
        }
    });

    return Backbone.Model.extend({
        database: Config.DataBase,
        idAttribute: 'index',

        comparator: function comparator(model) {
            return model.get('dt');
        },
        getId: function getId() {
            return this.get(this.idAttribute);
        },

        getDataModel: function getDataModel() {
            return new DataModel(this.get('data'));
        },
        isStream: function isStream() {
            return this.get('stream');
        },
        isStreamCreate: function isStreamCreate() {
            return this.get('stream_create');
        }
    });
});