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

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('url_parser', [], factory);
    } else {
        factory();
    }
})(undefined, function () {
    var required = function required(port, protocol) {
        protocol = protocol.split(':')[0];
        port = +port;

        if (!port) return false;

        switch (protocol) {
            case 'http':
            case 'ws':
                return port !== 80;

            case 'https':
            case 'wss':
                return port !== 443;

            case 'ftp':
                return port !== 21;

            case 'gopher':
                return port !== 70;

            case 'file':
                return false;
        }

        return port !== 0;
    };

    var qs = function () {
        var has = Object.prototype.hasOwnProperty,
            undef;

        function decode(input) {
            try {
                return decodeURIComponent(input.replace(/\+/g, ' '));
            } catch (e) {
                return null;
            }
        }

        function encode(input) {
            try {
                return encodeURIComponent(input);
            } catch (e) {
                return null;
            }
        }

        function querystring(query) {
            var parser = /([^=?&]+)=?([^&]*)/g,
                result = {},
                part;

            while (part = parser.exec(query)) {
                var key = decode(part[1]),
                    value = decode(part[2]);

                if (key === null || value === null || key in result) continue;
                result[key] = value;
            }

            return result;
        }

        function querystringify(obj, prefix) {
            prefix = prefix || '';

            var pairs = [],
                value,
                key;

            if ('string' !== typeof prefix) prefix = '?';

            for (key in obj) {
                if (has.call(obj, key)) {
                    value = obj[key];

                    if (!value && (value === null || value === undef || isNaN(value))) {
                        value = '';
                    }

                    key = encodeURIComponent(key);
                    value = encodeURIComponent(value);

                    if (key === null || value === null) continue;
                    pairs.push(key + '=' + value);
                }
            }

            return pairs.length ? prefix + pairs.join('&') : '';
        }

        return { stringify: querystringify, parse: querystring };
    }();

    var slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//,
        protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i,
        whitespace = '[\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\\u2029\\uFEFF]',
        left = new RegExp('^' + whitespace + '+');

    function trimLeft(str) {
        return (str ? str : '').toString().replace(left, '');
    }

    var rules = [['#', 'hash'], ['?', 'query'], function sanitize(address) {
        return address.replace('\\', '/');
    }, ['/', 'pathname'], ['@', 'auth', 1], [NaN, 'host', undefined, 1, 1], [/:(\d+)$/, 'port', undefined, 1], [NaN, 'hostname', undefined, 1, 1]];

    var ignore = { hash: 1, query: 1 };

    function lolcation(loc) {
        var globalVar;

        if (typeof window !== 'undefined') globalVar = window;else if (typeof global !== 'undefined') globalVar = global;else if (typeof self !== 'undefined') globalVar = self;else globalVar = {};

        var location = globalVar.location || {};
        loc = loc || location;

        var finaldestination = {},
            type = typeof loc === 'undefined' ? 'undefined' : _typeof(loc),
            key;

        if ('blob:' === loc.protocol) {
            finaldestination = new Url(unescape(loc.pathname), {});
        } else if ('string' === type) {
            finaldestination = new Url(loc, {});
            for (key in ignore) {
                delete finaldestination[key];
            }
        } else if ('object' === type) {
            for (key in loc) {
                if (key in ignore) continue;
                finaldestination[key] = loc[key];
            }

            if (finaldestination.slashes === undefined) {
                finaldestination.slashes = slashes.test(loc.href);
            }
        }

        return finaldestination;
    }

    function extractProtocol(address) {
        address = trimLeft(address);
        var match = protocolre.exec(address);

        return {
            protocol: match[1] ? match[1].toLowerCase() : '',
            slashes: !!match[2],
            rest: match[3]
        };
    }

    function resolve(relative, base) {
        if (relative === '') return base;

        var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/')),
            i = path.length,
            last = path[i - 1],
            unshift = false,
            up = 0;

        while (i--) {
            if (path[i] === '.') {
                path.splice(i, 1);
            } else if (path[i] === '..') {
                path.splice(i, 1);
                up++;
            } else if (up) {
                if (i === 0) unshift = true;
                path.splice(i, 1);
                up--;
            }
        }

        if (unshift) path.unshift('');
        if (last === '.' || last === '..') path.push('');

        return path.join('/');
    }

    function Url(address, location, parser) {
        address = trimLeft(address);

        if (!(this instanceof Url)) {
            return new Url(address, location, parser);
        }

        var relative,
            extracted,
            parse,
            instruction,
            index,
            key,
            instructions = rules.slice(),
            type = typeof location === 'undefined' ? 'undefined' : _typeof(location),
            url = this,
            i = 0;

        if ('object' !== type && 'string' !== type) {
            parser = location;
            location = null;
        }

        if (parser && 'function' !== typeof parser) parser = qs.parse;

        location = lolcation(location);

        extracted = extractProtocol(address || '');
        relative = !extracted.protocol && !extracted.slashes;
        url.slashes = extracted.slashes || relative && location.slashes;
        url.protocol = extracted.protocol || location.protocol || '';
        address = extracted.rest;

        if (!extracted.slashes) instructions[3] = [/(.*)/, 'pathname'];

        for (; i < instructions.length; i++) {
            instruction = instructions[i];

            if (typeof instruction === 'function') {
                address = instruction(address);
                continue;
            }

            parse = instruction[0];
            key = instruction[1];

            if (parse !== parse) {
                url[key] = address;
            } else if ('string' === typeof parse) {
                if (~(index = address.indexOf(parse))) {
                    if ('number' === typeof instruction[2]) {
                        url[key] = address.slice(0, index);
                        address = address.slice(index + instruction[2]);
                    } else {
                        url[key] = address.slice(index);
                        address = address.slice(0, index);
                    }
                }
            } else if (index = parse.exec(address)) {
                url[key] = index[1];
                address = address.slice(0, index.index);
            }

            url[key] = url[key] || (relative && instruction[3] ? location[key] || '' : '');

            if (instruction[4]) url[key] = url[key].toLowerCase();
        }

        if (parser) url.query = parser(url.query);

        if (relative && location.slashes && url.pathname.charAt(0) !== '/' && (url.pathname !== '' || location.pathname !== '')) {
            url.pathname = resolve(url.pathname, location.pathname);
        }

        if (!required(url.port, url.protocol)) {
            url.host = url.hostname;
            url.port = '';
        }

        url.username = url.password = '';
        if (url.auth) {
            instruction = url.auth.split(':');
            url.username = instruction[0] || '';
            url.password = instruction[1] || '';
        }

        url.origin = url.protocol && url.host && url.protocol !== 'file:' ? url.protocol + '//' + url.host : 'null';

        url.href = url.toString();
    }

    function set(part, value, fn) {
        var url = this;

        switch (part) {
            case 'query':
                if ('string' === typeof value && value.length) {
                    value = (fn || qs.parse)(value);
                }

                url[part] = value;
                break;

            case 'port':
                url[part] = value;

                if (!required(value, url.protocol)) {
                    url.host = url.hostname;
                    url[part] = '';
                } else if (value) {
                    url.host = url.hostname + ':' + value;
                }

                break;

            case 'hostname':
                url[part] = value;

                if (url.port) value += ':' + url.port;
                url.host = value;
                break;

            case 'host':
                url[part] = value;

                if (/:\d+$/.test(value)) {
                    value = value.split(':');
                    url.port = value.pop();
                    url.hostname = value.join(':');
                } else {
                    url.hostname = value;
                    url.port = '';
                }

                break;

            case 'protocol':
                url.protocol = value.toLowerCase();
                url.slashes = !fn;
                break;

            case 'pathname':
            case 'hash':
                if (value) {
                    var char = part === 'pathname' ? '/' : '#';
                    url[part] = value.charAt(0) !== char ? char + value : value;
                } else {
                    url[part] = value;
                }
                break;

            default:
                url[part] = value;
        }

        for (var i = 0; i < rules.length; i++) {
            var ins = rules[i];

            if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
        }

        url.origin = url.protocol && url.host && url.protocol !== 'file:' ? url.protocol + '//' + url.host : 'null';

        url.href = url.toString();

        return url;
    }

    function toString(stringify) {
        if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

        var query,
            url = this,
            protocol = url.protocol;

        if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

        var result = protocol + (url.slashes ? '//' : '');

        if (url.username) {
            result += url.username;
            if (url.password) result += ':' + url.password;
            result += '@';
        }

        result += url.host + url.pathname;

        query = 'object' === _typeof(url.query) ? stringify(url.query) : url.query;
        if (query) result += '?' !== query.charAt(0) ? '?' + query : query;

        if (url.hash) result += url.hash;

        return result;
    }

    Url.prototype = { set: set, toString: toString };

    Url.extractProtocol = extractProtocol;
    Url.location = lolcation;
    Url.trimLeft = trimLeft;
    Url.qs = qs;

    return Url;
});