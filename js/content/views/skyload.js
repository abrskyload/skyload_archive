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

define('SKYLOAD', ['APP', 'jquery'], function (Skyload, $) {

    Skyload.SendMessageFromContentToBackground({ method: 'reset_profile' }, function (response) {});

    $('.js-install').attr('data-install', true);
});