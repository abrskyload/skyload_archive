;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(root.jQuery);
    }
}(this, function($){
    var defaults = {
        axis		    : 'y',
        wheel		    : 30,
        scroll		    : true,
        size		    : 'auto',
        size_thumb	    : 'auto',

        animation       : false,
        animation_speed : 240,
        animation_easing: 'linear',

        class_container : 'sb_container',
        class_scrollbar : 'sb_scrollbar',
        class_track     : 'sb_track',
        class_thumb     : 'sb_thumb',
        class_view_port : 'sb_view_port',
        class_overview  : 'sb_overview',

        class_disable   : 'sb_disable',
        class_move      : 'sb_move',

        delay_leave     : 1000,

        onScroll	    : function(content, view_port, scroll){}
    };

    $.fn.scrollBar = function(options) {
        options = $.extend({}, defaults, options);

        this.each(function(){
            $(this).data('scrollBar', new ScrollBar($(this), options));
        });

        return this;
    };

    $.fn.scrollBarUpdate = function(sScroll) {
        var data = $(this).data('scrollBar');
        if(data) {
            return $(this).data('scrollBar').update(sScroll);
        } else console.log('ScrollBar Error update :: data not found');
    };

    function ScrollBar($root, options){
        var oSelf = this;

        $root.addClass(options.class_container)
            .wrapInner($('<div />').addClass(options.class_view_port)
                .html($('<div />').addClass(options.class_overview)))
            .prepend($('<div />').addClass(options.class_scrollbar)
                .html($('<div />').addClass(options.class_track)
                    .html($('<div />').addClass(options.class_thumb))));


        var oWrapper    = $root;
        var oViewPort   = { obj: $('.' + options.class_view_port, $root) };
        var oContent    = { obj: $('.' + options.class_overview, $root) };
        var oScrollBar  = { obj: $('.' + options.class_scrollbar, $root) };
        var oTrack      = { obj: $('.' + options.class_track, oScrollBar.obj) };
        var oThumb      = { obj: $('.' + options.class_thumb, oScrollBar.obj) };

        var sAxis       = options.axis == 'x',
            sDirection  = sAxis ? 'left' : 'top',
            sSize       = sAxis ? 'Width' : 'Height';

        var iScroll, dMove = false, tMove = null,
            iPosition   = { start: 0, now: 0 },
            iMouse      = {};

        function initialize() {
            oSelf.update();
            setEvents();
            return oSelf;
        }

        this.update = function(sScroll){
            oViewPort[options.axis] = oViewPort.obj[0]['offset'+ sSize];

            oContent[options.axis] = oContent.obj[0]['scroll'+ sSize];
            oContent.ratio = oViewPort[options.axis] / oContent[options.axis];

            oScrollBar.obj.toggleClass(options.class_disable, oContent.ratio >= 1);

            oTrack[options.axis] = options.size == 'auto' ? oViewPort[options.axis] : options.size;
            oThumb[options.axis] = Math.min(
                oTrack[options.axis],
                Math.max(0, ( options.size_thumb == 'auto' ?
                    (oTrack[options.axis] * oContent.ratio) :
                    options.size_thumb )
                )
            );

            oScrollBar.ratio = options.size_thumb == 'auto' ?
                (oContent[options.axis] / oTrack[options.axis]) :
            (oContent[options.axis] - oViewPort[options.axis]) / (oTrack[options.axis] - oThumb[options.axis]);

            iScroll = (sScroll == 'relative' && oContent.ratio <= 1) ?
                Math.min((oContent[options.axis] - oViewPort[options.axis]), Math.max(0, iScroll)) : 0;

            iScroll = (sScroll == 'bottom' && oContent.ratio <= 1) ?
                (oContent[options.axis] - oViewPort[options.axis]) :
                isNaN(parseInt(sScroll)) ?
                    iScroll :
                    parseInt(sScroll);

            setSize();
        };

        function setSize(){
            oThumb.obj.css(sDirection, iScroll / oScrollBar.ratio);
            oContent.obj.css(sDirection, -iScroll);
            iMouse['start'] = oThumb.obj.offset()[sDirection];
            var sCssSize = sSize.toLowerCase();
            oScrollBar.obj.css(sCssSize, oTrack[options.axis]);
            oTrack.obj.css(sCssSize, oTrack[options.axis]);
            oThumb.obj.css(sCssSize, oThumb[options.axis]);
        };

        function setEvents(){
            oWrapper
                .bind('mousemove', function(){
                    if(!dMove) {
                        oWrapper.addClass(options.class_move);
                    }

                    dMove = true;
                })
                .bind('mouseleave', out);
            oThumb.obj.bind('mousedown', start);
            oThumb.obj[0].ontouchstart = function(oEvent){
                oEvent.preventDefault();
                oThumb.obj.unbind('mousedown');
                start(oEvent.touches[0]);
                return false;
            };
            oTrack.obj.bind('mouseup', drag);
            if(options.scroll && this.addEventListener){
                oWrapper[0].addEventListener('DOMMouseScroll', wheel, false);
                oWrapper[0].addEventListener('mousewheel', wheel, false );
            }
            else if(options.scroll){oWrapper[0].onmousewheel = wheel;}
        };

        function start(oEvent){
            iMouse.start = sAxis ? oEvent.pageX : oEvent.pageY;
            var oThumbDir = parseInt(oThumb.obj.css(sDirection));
            iPosition.start = oThumbDir == 'auto' ? 0 : oThumbDir;

            $(document).bind('mousemove', drag);
            document.ontouchmove = function(oEvent){
                $(document).unbind('mousemove');
                drag(oEvent.touches[0]);
            };
            $(document).bind('mouseup', end);
            oThumb.obj.bind('mouseup', end);
            oThumb.obj[0].ontouchend = document.ontouchend = function(oEvent){
                $(document).unbind('mouseup');
                oThumb.obj.unbind('mouseup');
                end(oEvent.touches[0]);
            };
            return false;
        };

        function wheel(oEvent){
            if(!(oContent.ratio >= 1)){
                oEvent = oEvent || window.event;

                var iDelta = oEvent.wheelDelta ? oEvent.wheelDelta/120 : -oEvent.detail/3;

                iScroll -= iDelta * options.wheel;
                iScroll = Math.min((oContent[options.axis] - oViewPort[options.axis]), Math.max(0, iScroll));


                if(options.animation) {
                    var aThumb = {}, aContent = {};

                    aThumb[sDirection] = iScroll / oScrollBar.ratio;
                    aContent[sDirection] = -iScroll;

                    oThumb.obj.stop().animate(aThumb, options.animation_speed, options.animation_easing);
                    oContent.obj.stop().animate(aContent, options.animation_spped, options.animation_easing);
                } else {
                    oThumb.obj.css(sDirection, iScroll / oScrollBar.ratio);
                    oContent.obj.css(sDirection, -iScroll);
                }

                options.onScroll(oContent[options.axis], oViewPort[options.axis], iScroll);

                oEvent = $.event.fix(oEvent);
                oEvent.preventDefault();
            };
        };

        function end(oEvent){
            $(document).unbind('mousemove', drag);
            $(document).unbind('mouseup', end);
            oThumb.obj.unbind('mouseup', end);
            document.ontouchmove = oThumb.obj[0].ontouchend = document.ontouchend = null;

            out();

            return false;
        };

        function drag(oEvent){
            dMove = true;

            if(!(oContent.ratio >= 1)){
                iPosition.now = Math.min((oTrack[options.axis] - oThumb[options.axis]), Math.max(0, (iPosition.start + ((sAxis ? oEvent.pageX : oEvent.pageY) - iMouse.start))));
                iScroll = iPosition.now * oScrollBar.ratio;
                oContent.obj.css(sDirection, -iScroll);
                oThumb.obj.css(sDirection, iPosition.now);

                options.onScroll(oContent[options.axis], oViewPort[options.axis], iScroll);
            }
            return false;
        };

        function out(){
            dMove = false;

            clearTimeout(tMove);

            tMove = setTimeout(function(){
                if(!dMove) {
                    oWrapper.removeClass(options.class_move);
                }
            }, options.delay_leave);

            return false;
        };

        return initialize();
    };

    return ScrollBar;
}));