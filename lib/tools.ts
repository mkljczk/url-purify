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
/*
 * This script is responsible for some tools.
 */

// Needed by the sha256 method
const enc = new TextEncoder();

// Max amount of log entries to prevent performance issues
const logThreshold = 5000;

/*
 * To support Waterfox.
 */
Array.prototype.rmEmpty = () => this.filter((v) => v);

/*
 * To support Waterfox.
 */
Array.prototype.flatten = () => this.reduce((a, b) => a.concat(b), []);

/**
 * Check if an object is empty.
 */
const isEmpty = (obj: Object) => Object.getOwnPropertyNames(obj).length === 0;

/**
 * Extract the host without port from an url.
 */
const extractHost = (url: URL) => url.hostname;

/**
 * Return the number of parameters query strings.
 */
const countFields = (url: string) => [...new URL(url).searchParams].length;

/**
 * Extract the fragments from an url.
 * @param  {URL} url URL as object
 * @return {URLHashParams}     fragments as URLSearchParams object
 */
const extractFragments = (url: URL) => new URLHashParams(url);

/**
 * Returns the given URL without searchParams and hash.
 */
const urlWithoutParamsAndHash = (url: URL) => {
  let newURL = url.toString();

  if (url.search) {
    newURL = newURL.replace(url.search, "");
  }

  if (url.hash) {
    newURL = newURL.replace(url.hash, "");
  }

  return new URL(newURL);
};

/**
 * Decodes an URL, also one that is encoded multiple times.
 *
 * @see https://stackoverflow.com/a/38265168
 */
const decodeURL = (url: string) => {
  let rtn = decodeURIComponent(url);

  while (isEncodedURI(rtn)) {
    rtn = decodeURIComponent(rtn);
  }

  // Required (e.g., to fix https://github.com/ClearURLs/Addon/issues/71)
  if (!rtn.startsWith("http")) {
    rtn = "http://" + rtn;
  }

  return rtn;
};

/**
 * Returns true, iff the given URI is encoded
 * @see https://stackoverflow.com/a/38265168
 */
const isEncodedURI = (uri: string) => uri !== decodeURIComponent(uri || "");

/**
 * Gets the value of at `key` an object. If the resolved value is `undefined`, the `defaultValue` is returned in its place.
 */
Object.prototype.getOrDefault = (key: string, defaultValue: Object) =>
  this[key] === undefined ? defaultValue : this[key];

const handleError = (error: any) => {
  console.error("[ClearURLs ERROR]:" + error);
};

/**
 * Checks if the storage is available.
 */
const isStorageAvailable = () => storage.ClearURLsData.length !== 0;

/**
 * This method calculates the SHA-256 hash as HEX string of the given message.
 * This method uses the native hashing implementations of the SubtleCrypto interface which is supported by all browsers
 * that implement the Web Cryptography API specification and is based on:
 * https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
 *
 * @param message message for which the hash should be calculated
 * @returns {Promise<string>} SHA-256 of the given message
 */
const sha256 = async (message: string) => {
  const msgUint8 = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Generates a non-secure random ASCII string of length {@code len}.
 *
 * @returns non-secure random ASCII
 */
const randomASCII = (len: number) =>
  [...Array(len)].map(() => (~~(Math.random() * 36)).toString(36)).join("");

/**
 * Returns an URLSearchParams as string.
 * Does handle spaces correctly.
 */
const urlSearchParamsToString = (searchParams: URLSearchParams) => {
  const rtn: Array<string> = [];

  searchParams.forEach((value, key) => {
    if (value) {
      rtn.push(key + "=" + encodeURIComponent(value));
    } else {
      rtn.push(key);
    }
  });

  return rtn.join("&");
};

export {
  isEmpty,
  extractHost,
  extractFragments,
  urlWithoutParamsAndHash,
  decodeURL,
  handleError,
  randomASCII,
  urlSearchParamsToString,
};
