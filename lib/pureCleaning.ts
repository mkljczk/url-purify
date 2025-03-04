/*
* ClearURLs
* Copyright (c) 2017-2025 Kevin Röbert
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jshint esversion: 6 */

/**
 * Cleans given URLs. Also do automatic redirection.
 *
 * @param  {String} url     url as string
 * @return {String}         cleaned URL
 */
const pureCleaning = (url: string) => {
    let before = url;
    let after = url;

    do {
        before = after;
        after = _cleaning(before);
    } while (after !== before); // do recursive cleaning

    return after;
}

/**
 * Internal function to clean the given URL.
 */
const _cleaning = (url: string) => {
    let cleanURL = url;

    for (let i = 0; i < providers.length; i++) {
        let result = {
            "changes": false,
            "url": "",
            "redirect": false,
            "cancel": false
        };

        if (providers[i].matchURL(cleanURL)) {
            result = removeFieldsFormURL(providers[i], cleanURL);
            cleanURL = result.url;
        }

        if (result.redirect) {
            return result.url;
        }
    }

    return cleanURL;
}
