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

window.RequireJS = function () {
    var _this = this;

    this.modules = [];
    this.exports = {};

    this.add('exports', [], function () {
        return _this.exports;
    });
};

RequireJS.prototype = {
    add: function add(name, dependencies, callback) {
        var empty = !this.modules.filter(function (model) {
            return model.name == name;
        }).length;

        if (empty) {
            var renamed = false;
            var _name = Date.now().toString();

            if (typeof name == 'function') {
                callback = name;
                dependencies = [];
                name = _name;
                renamed = true;
            } else if (typeof name !== 'string') {
                callback = dependencies;
                dependencies = name;
                name = _name;
                renamed = true;
            }

            this.modules.push({
                run: false,
                name: name,
                renamed: renamed,
                dependencies: dependencies,
                callback: callback,
                handler: null
            });
        }

        return this.run();
    },
    get: function get(name) {
        return this.modules.filter(function (model) {
            return model.name == name;
        })[0];
    },
    run: function run() {
        var _this2 = this;

        for (var i in this.modules) {
            var model = this.modules[i];
            var name = model.name;
            var dependencies = [];

            if (!model.run) {
                if (model.dependencies.length) {
                    model.dependencies.forEach(function (dependence) {
                        if (_this2.check(dependence)) {
                            var module = _this2.get(dependence);

                            if (module) {
                                dependencies.push(module.handler);
                            }
                        }
                    });

                    if (dependencies.length == model.dependencies.length) {
                        model.run = true;

                        if (typeof model.callback == 'function') {
                            model.handler = model.callback.apply(window, dependencies);
                        }

                        if (typeof model.handler == 'undefined') {
                            model.handler = this.exports;
                        }

                        if (model.renamed) {
                            this.rename(name);
                        }
                    }
                } else {
                    model.run = true;
                    model.handler = model.callback();

                    if (model.renamed) {
                        this.rename(name);
                    }
                }
            }
        }

        return this;
    },
    check: function check(name) {
        var _this3 = this;

        var module = this.get(name);
        var ready = false;

        if (module) {
            if (module.run) {
                ready = true;
            } else {
                ready = !!module.dependencies.map(function (dependence) {
                    return _this3.check(dependence);
                }).filter(function (has) {
                    return !has;
                }).length;
            }
        }

        return ready;
    },
    rename: function rename(name) {
        try {
            var module = this.get(name);

            if (module) {
                var handler = module.handler;

                var key = this.modules.map(function (model, index) {
                    if (model.name == name) {
                        return index;
                    }
                }).filter(function (index) {
                    return !!index;
                })[0];

                if (handler['Model'] && handler['Collection'] && handler['Router']) {
                    this.modules[key].name = 'backbone';
                } else if (handler.prototype) {
                    var newName = handler.prototype.constructor.name.toString().toLowerCase();

                    if (newName === 'o') {
                        newName = 'deezer_decoder';
                    }

                    this.modules[key].name = newName;
                }
            }
        } catch (e) {
            console.info('Skylaod error in require', e);
        }
    }
};

window.Require = new RequireJS();

window.exports = {};
window.require = function (name) {
    var module = Require.get(name);

    if (module && module.run) {
        return module.handler;
    }
};

window.define = function (name, dependencies, callback) {
    Require.add(name, dependencies, callback);
};

define.amd = true;