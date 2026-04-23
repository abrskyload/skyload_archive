(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && 'exports' in module) {
        module.exports = factory(root.jQuery);
    } else {
        factory(root.jQuery);
    }
}(this, function($) {
    $.fn.ripple = function(selector, custom){
        var $this = $(this);

        var defaults = {
            elem_class : 'ink',
            effect_name : 'animate'
        };

        var options = $.extend({}, defaults, custom);

        $this.delegate(selector, 'click', function(e){
            var $this, $ink, d, x, y;
            var elem_selector = ['.', options.elem_class].join('');

            $this = $(this);

            if($this.find(elem_selector).length == 0) {
                var position = $this.css('position');

                if(position != 'absolute') {
                    position = 'relative';
                }

                $this.css({
                    position : position,
                    overflow : 'hidden'
                });

                $this.prepend($('<span />').addClass(options.elem_class));
            }

            $ink = $this.find(elem_selector);
            $ink.removeClass(options.effect_name);

            if(!$ink.height() && !$ink.width()) {
                d = Math.max($this.outerWidth(), $this.outerHeight());
                $ink.css({height: d, width: d});
            }

            x = e.pageX - $this.offset().left - $ink.width()/2;
            y = e.pageY - $this.offset().top - $ink.height()/2;

            $ink.css({top: y+'px', left: x+'px'}).addClass(options.effect_name);
        });
    };
}));

