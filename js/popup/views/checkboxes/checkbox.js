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

define('checkbox_view', ['backbone', 'underscore', 'jquery'], function (Backbone, _, $) {
    return Backbone.View.extend({
        tagName: 'div',
        className: 'b-checkbox',
        status: 'enabled',
        label: null,
        title: null,
        template: _.template($('#template-checkbox').html()),
        events: {
            'click': 'select'
        },
        onCheck: function onCheck() {
            return this;
        },
        isChecked: function isChecked() {
            return this.status == 'enabled';
        },
        render: function render() {
            if (_.isNull(this.title)) {
                this.title = this.label;
            }

            this.$el.attr('title', this.title).html(this.template({ label: this.label }));
            return this;
        },
        select: function select() {
            return this.active(this.status != 'enabled').onCheck();
        },
        active: function active(value) {
            this.status = value ? 'enabled' : 'disabled';
            this.$el.removeClass('b-checkbox-enabled b-checkbox-disabled').addClass('b-checkbox-' + this.status);

            return this;
        },
        setLabel: function setLabel(label) {
            this.label = label;
            return this;
        },
        setTitle: function setTitle(title) {
            this.title = title;
            return this;
        }
    });
});