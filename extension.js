'use strict';

/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const ExtensionUtils = imports.misc.extensionUtils;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const MainLoop = imports.mainloop;
const Util = imports.misc.util;

var SurfSearchProvider = class SurfSearchProvider {

    constructor() {
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.surf');
        this.appInfo = Gio.AppInfo.get_default_for_uri_scheme('https');
    }

    /**
     * Get triggers as string array
     * @returns {String[]}
     */
    get triggers() {
        return this._settings.get_string('triggers').replace(/\s+/g, '').split(',');
    }

    /**
     * Validate URL strings
     * @param {String} str
     * @returns {boolean}
     * @private
     */
    _isValidUrl(str) {
        const protocol = '^(https?:\\/\\/)?';
        const domain = '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}';
        const ipv4 = '((\\d{1,3}\\.){3}\\d{1,3}))';
        const port = '(\\:\\d+)?';
        const path = '(\\/[-a-z\\d%_.~+]*)*';
        const queryString = '(\\?[;&a-z\\d%_.~+=-]*)?';
        const fragmentLocator = '(\\#[-a-z\\d_]*)?$';

        const regExp = `${protocol}${domain}|${ipv4}${port}${path}${queryString}${fragmentLocator}`;

        return new RegExp(regExp, 'i').test(str);
    }

    /**
     * Add HTTP protocol if needed
     * @param {String} url
     * @returns {String}
     * @private
     */
    _addHttpProtocol(url) {
        return url.toLowerCase().startsWith('http') ? url : `http://${url}`
    }

    /**
     * Get initial result set
     * @param {String[]} terms
     * @param {Function} callback
     */
    getInitialResultSet(terms, callback) {
        if (this.triggers.includes(terms[0].charAt(0)) || this.triggers.includes(terms[0])) {
            if (terms.length >= 2 || terms[0].length > 1) {
                callback(['surf']);
            }
        }
    }

    /**
     * Get subsearch result set
     * @param {String[]} previousResults
     * @param {String[]} terms
     */
    getSubsearchResultSet(previousResults, terms) {
        // return previousResults;
    }

    /**
     * Run callback with results
     * @param {String[]} identifiers
     * @param {Function} callback
     */
    getResultMetas(identifiers, callback) {
        callback([{
            id: 'surf',
            name: 'Browse:',
            description: 'Visit URL or perform a web search with the terms provided',
            createIcon: () => {
            }
        }]);
    }

    /**
     * Return subset of results
     * @param {Array} results
     * @param {number} max
     * @returns {String[]}
     */
    filterResults(results, max) {
        if (results.length > max) {
            results.splice(max - 1, results.length - max);
        }

        return results;
    }

    /**
     * Open the url in default app
     * @param {String} id
     * @param {String[]} terms
     */
    activateResult(id, terms) {
        // Remove trigger
        if (terms[0].length > 1 && this.triggers.includes(terms[0].charAt(0))) {
            terms[0] = terms[0].slice(1);
        } else {
            terms.splice(0, 1);
        }

        const url = terms.length === 1 && this._isValidUrl(terms[0])
            ? this._addHttpProtocol(terms[0])
            : `${this._settings.get_string('search-url')}${encodeURIComponent(terms.join(' '))}`;

        Gio.AppInfo.launch_default_for_uri(url, null) || Util.trySpawnCommandLine(`xdg-open ${url}`);
    }

}

class Extension {

    constructor() {
        this._surfSearchProvider = null;
        this._delayedRegistration = null;
    }

    get searchResults() {
        return shellVersion < 40
            ? Main.overview.viewSelector._searchResults
            : Main.overview._overview.controls._searchController._searchResults;
    }

    enable() {
        MainLoop.idle_add(() => {
            if (this._surfSearchProvider === null) {
                this._surfSearchProvider = new SurfSearchProvider();
            }
            this.searchResults._registerProvider(this._surfSearchProvider);
        });
    }

    disable() {
        MainLoop.idle_add(() => {
            if (this._surfSearchProvider) {
                this.searchResults._unregisterProvider(this._surfSearchProvider);
                this._surfSearchProvider = null;
            }
        });
    }

}

/**
 * @returns {Extension}
 */
function init() {
    return new Extension();
}
