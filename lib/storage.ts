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
 * This script is responsible for the storage.
 */
var storage: Record<string, any> = {};
var hasPendingSaves = false;
var pendingSaves = new Set();

/**
 * Writes the storage variable to the disk.
 */
const saveOnExit = () => {
  saveOnDisk(Object.keys(storage));
};

/**
 * Returns the storage as JSON.
 */
const storageAsJSON = () => {
  let json = {};

  Object.entries(storage).forEach(([key, value]) => {
    json[key] = storageDataAsString(key);
  });

  return json;
};

/**
 * Converts a given storage data to its string representation.
 */
const storageDataAsString = (key: string) => {
  let value = storage[key];

  switch (key) {
    case "ClearURLsData":
    case "log":
      return JSON.stringify(value);
    case "types":
      return value.toString();
    default:
      return value;
  }
};

/**
 * Delete key from browser storage.
 */
const deleteFromDisk = (key: string) => {
  browser.storage.local.remove(key).catch(handleError);
};

/**
 * Save multiple keys on the disk.
 */
const saveOnDisk = (keys: string[]) => {
  let json = {};

  keys.forEach((key) => {
    json[key] = storageDataAsString(key);
  });

  browser.storage.local.set(json).catch(handleError);
};

/**
 * Schedule to save a key to disk in 30 seconds.
 */
const deferSaveOnDisk = (key: string) => {
  if (hasPendingSaves) {
    pendingSaves.add(key);
    return;
  }

  setTimeout(() => {
    saveOnDisk(Array.from(pendingSaves));
    pendingSaves.clear();
    hasPendingSaves = false;
  }, 30000);
  hasPendingSaves = true;
};

/**
 * Start sequence for ClearURLs.
 */
const genesis = () => {
  browser.storage.local.get(null).then((items) => {
    initStorage(items);

    // Start the clearurls.js
    start();
  }, handleError);
};

/**
 * Return the value under the key.
 */
const getData = (key: string) => storage[key];

/**
 * Return the entire storage object.
 */
const getEntireData = () => storage;

/**
 * Save the value under the key on the RAM.
 *
 * Note: To store the data on the hard disk, one of
 *  deferSaveOnDisk(), saveOnDisk(), or saveOnExit()
 *  must be called.
 */
const setData = (key: String, value: Object) => {
  switch (key) {
    case "ClearURLsData":
    case "log":
      storage[key] = JSON.parse(value);
      break;
    case "hashURL":
    case "ruleURL":
      storage[key] = replaceOldURLs(value);
      break;
    case "types":
      storage[key] = value.split(",");
      break;
    default:
      storage[key] = value;
  }
};

/**
 * Set default values, if the storage is empty.
 */
const initStorage = (items: Object) => {
  initSettings();

  if (!isEmpty(items)) {
    Object.entries(items).forEach(([key, value]) => {
      setData(key, value);
    });
  }
};

/**
 * Set default values for the settings.
 */
const initSettings = () => {
  storage.ClearURLsData = [];
  storage.dataHash = "";
  storage.badgedStatus = true;
  storage.globalStatus = true;
  storage.hashStatus = "error";
  storage.loggingStatus = false;
  storage.log = { log: [] };
  storage.statisticsStatus = true;
  storage.badged_color = "#ffa500";
  storage.hashURL = "https://rules2.clearurls.xyz/rules.minify.hash";
  storage.ruleURL = "https://rules2.clearurls.xyz/data.minify.json";
  storage.contextMenuEnabled = true;
  storage.historyListenerEnabled = true;
  storage.localHostsSkipping = true;
  storage.referralMarketing = true;
  storage.logLimit = 100;
  storage.domainBlocking = true;
  storage.pingBlocking = true;
  storage.eTagFiltering = false;
  storage.watchDogErrorCount = 0;

  if (getBrowser() === "Firefox") {
    storage.types = [
      "font",
      "image",
      "imageset",
      "main_frame",
      "media",
      "object",
      "object_subrequest",
      "other",
      "script",
      "stylesheet",
      "sub_frame",
      "websocket",
      "xml_dtd",
      "xmlhttprequest",
      "xslt",
    ];
    storage.pingRequestTypes = ["ping", "beacon"];
  } else if (getBrowser() === "Chrome") {
    storage.types = [
      "main_frame",
      "sub_frame",
      "stylesheet",
      "script",
      "image",
      "font",
      "object",
      "xmlhttprequest",
      "ping",
      "csp_report",
      "media",
      "websocket",
      "other",
    ];
    storage.pingRequestTypes = ["ping"];
  }
};

/**
 * Replace the old URLs with the
 * new GitLab URLs.
 */
const replaceOldURLs = (url: string) => {
  switch (url) {
    case "https://raw.githubusercontent.com/KevinRoebert/ClearUrls/master/data/rules.hash?flush_cache=true":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/rules.minify.hash";
    case "https://raw.githubusercontent.com/KevinRoebert/ClearUrls/master/data/data.json?flush_cache=true":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/data.minify.json";
    case "https://gitlab.com/KevinRoebert/ClearUrls/raw/master/data/rules.hash":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/rules.minify.hash";
    case "https://gitlab.com/KevinRoebert/ClearUrls/raw/master/data/data.json":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/data.minify.json";
    case "https://gitlab.com/KevinRoebert/ClearUrls/-/jobs/artifacts/master/raw/rules.min.hash?job=hash%20rules":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/rules.minify.hash";
    case "https://gitlab.com/KevinRoebert/ClearUrls/raw/master/data/data.min.json":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/data.minify.json";
    case "https://gitlab.com/KevinRoebert/ClearUrls/raw/master/data/data.minify.json":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/data.minify.json";
    case "https://gitlab.com/KevinRoebert/ClearUrls/-/jobs/artifacts/master/raw/data.minify.json?job=hash%20rules":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/data.minify.json";
    case "https://gitlab.com/KevinRoebert/ClearUrls/-/jobs/artifacts/master/raw/rules.minify.hash?job=hash%20rules":
      return "https://kevinroebert.gitlab.io/ClearUrls/data/rules.minify.hash";
    case "https://kevinroebert.gitlab.io/ClearUrls/data/data.minify.json":
      return "https://rules2.clearurls.xyz/data.minify.json";
    case "https://kevinroebert.gitlab.io/ClearUrls/data/rules.minify.hash":
      return "https://rules2.clearurls.xyz/rules.minify.hash";
    default:
      return url;
  }
};

/**
 * Load local saved data, if the browser is offline or
 * some other network trouble.
 */
const loadOldDataFromStore = () => {
  localDataHash = storage.dataHash;
};

/**
 * Save the hash status to the local storage (RAM).
 * The status can have the following values:
 *  1 "up to date"
 *  2 "updated"
 *  3 "update available"
 */
const storeHashStatus = (status_code: number) => {
  let status: string;
  switch (status_code) {
    case 1:
      status = "hash_status_code_1";
      break;
    case 2:
      status = "hash_status_code_2";
      break;
    case 3:
      status = "hash_status_code_3";
      break;
    case 5:
      status = "hash_status_code_5";
      break;
    case 4:
    default:
      status = "hash_status_code_4";
  }

  storage.hashStatus = status;
};

// Start storage and ClearURLs
genesis();
