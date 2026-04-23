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

define('access_model', ['data_base_model'], function (DataBaseModel) {
    return DataBaseModel.extend({
        storeName: 'access',
        defaults: {
            domain: null,
            sound: true,
            video: true,
            photo: true,
            file: true
        },
        idAttribute: 'domain'
    });
});