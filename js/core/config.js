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

define('config', ['underscore'], function (_) {
    return {
        Locales: {
            en: 'English',
            ru: 'Русский',
            de: 'Deutsch',
            es: 'Español',
            fr: '‪Français',
            it: '‪Italiano‬‬',
            pt_BR: 'Português (Brasil)',
            pl: 'Polski',
            uk: 'Українська‬'
        },

        DataBase: {
            id: "skyload",
            description: "Skyload database for audio, video, photo, file and profile models",
            nolog: true,
            migrations: [{
                version: 1,
                migrate: function migrate(transaction, next) {
                    var table = {};
                    var namespace = _.extend({}, Skyload.CacheNamespace);

                    _.each(['download', 'access'], function (index) {
                        delete namespace[index];
                    });

                    _.each(namespace, function (name, index) {
                        table[index] = transaction.db.createObjectStore(index, { keyPath: 'index' });

                        table[index].createIndex('index', 'index', { unique: true });
                        table[index].createIndex('id', 'id', { unique: false });
                        table[index].createIndex('source', 'source', { unique: false });
                    });

                    next();
                }
            }, {
                version: 2,
                migrate: function migrate(transaction, next) {
                    var download = transaction.db.createObjectStore('download', { keyPath: 'index' });
                    download.createIndex('id', 'id', { unique: false });
                    download.createIndex('index', 'index', { unique: false });

                    next();
                }
            }, {
                version: 3,
                migrate: function migrate(transaction, next) {
                    var access = transaction.db.createObjectStore('access', { keyPath: 'domain' });
                    access.createIndex('domain', 'domain', { unique: true });

                    next();
                }
            }]
        }
    };
});