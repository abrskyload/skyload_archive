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

define('checkbox_group_view', ['checkbox_view', 'common'], function (CheckBoxView) {
    return CheckBoxView.extend({
        initialize: function initialize() {
            var _this = this;

            this.setLabel(Skyload.getLocale('upload_to_sep_dir')).setTitle(Skyload.getLocale('to_sep_dir_des')).active(false);

            Skyload.App.getModel().on('change:separate_directory', function (model, value) {
                _this.active(value);
            });
        },
        onCheck: function onCheck() {
            Skyload.App.getModel().setSeparateDirectory(this.isChecked());
            return this;
        }
    });
});