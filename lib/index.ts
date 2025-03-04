/*
 * ClearURLs
 * Copyright (c) 2017-2021 Kevin Röbert
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

import {
  decodeURL,
  extractFragments,
  urlSearchParamsToString,
  urlWithoutParamsAndHash,
} from "./tools";

/*jshint esversion: 6 */
/*
 * This script is responsible for the core functionalities.
 */
var providers: Array<Provider> = [];
var prvKeys: Array<string> = [];
var siteBlockedAlert = "javascript:void(0)";
var dataHash: string;
var localDataHash: string;

/**
 * Helper function which remove the tracking fields
 * for each provider given as parameter.
 *
 * @param provider      Provider-Object
 * @param pureUrl                   URL as String
 * @return Array with changes and url fields
 */
const removeFieldsFormURL = (
  provider: Provider,
  pureUrl: string,
): {
  url?: string;
  cancel?: boolean;
  changes?: boolean;
  redirect?: boolean;
} => {
  let url = pureUrl;
  let domain = "";
  let fragments: URLSearchParams;
  let fields: URLSearchParams;
  let rules = provider.getRules();
  let changes = false;
  let rawRules = provider.getRawRules();
  let urlObject = new URL(url);

  /*
   * Expand the url by provider redirections. So no tracking on
   * url redirections form sites to sites.
   */
  let re = provider.getRedirection(url);
  if (re !== null) {
    url = decodeURL(re);

    return {
      redirect: true,
      url: url,
    };
  }

  if (provider.isCaneling() && storage.domainBlocking) {
    return {
      cancel: true,
      url: url,
    };
  }

  /*
   * Apply raw rules to the URL.
   */
  rawRules.forEach((rawRule) => {
    let beforeReplace = url;
    url = url.replace(new RegExp(rawRule, "gi"), "");

    if (beforeReplace !== url) {
      changes = true;
    }
  });

  urlObject = new URL(url);
  fields = urlObject.searchParams;
  fragments = extractFragments(urlObject);
  domain = urlWithoutParamsAndHash(urlObject).toString();

  /**
   * Only test for matches, if there are fields or fragments that can be cleaned.
   */
  if (fields.toString() !== "" || fragments.toString() !== "") {
    rules.forEach((rule) => {
      for (const field of fields.keys()) {
        if (new RegExp("^" + rule + "$", "gi").test(field)) {
          fields.delete(field);
          changes = true;
        }
      }

      for (const fragment of fragments.keys()) {
        if (new RegExp("^" + rule + "$", "gi").test(fragment)) {
          fragments.delete(fragment);
          changes = true;
        }
      }
    });

    let finalURL = domain;

    if (fields.toString() !== "")
      finalURL += "?" + urlSearchParamsToString(fields);
    if (fragments.toString() !== "") finalURL += "#" + fragments.toString();

    url = finalURL
      .replace(new RegExp("\\?&"), "?")
      .replace(new RegExp("#&"), "#");
  }

  return {
    changes: changes,
    url: url,
  };
};

/*
 * ##################################################################
 * # Supertyp Provider                                              #
 * ##################################################################
 */
class Provider {
  name: string;
  urlPattern: RegExp;
  enabled_rules = {};
  disabled_rules = {};
  enabled_exceptions = {};
  disabled_exceptions = {};
  completeProvider: boolean;
  canceling: boolean;
  forceRedirection: boolean;
  enabled_redirections = {};
  disabled_redirections = {};
  active: boolean;
  enabled_rawRules = {};
  disabled_rawRules = {};
  enabled_referralMarketing = {};
  disabled_referralMarketing = {};
  methods: Array<string> = [];

  /**
   * Declare constructor
   *
   * @param name             Provider name
   * @param completeProvider Set URL Pattern as rule
   * @param forceRedirection Whether redirects should be enforced via a "tabs.update"
   * @param isActive         Is the provider active?
   */
  constructor(
    name: string,
    completeProvider = false,
    forceRedirection = false,
    isActive = true,
  ) {
    this.name = name;
    this.completeProvider = completeProvider;
    this.canceling = completeProvider;
    this.forceRedirection = forceRedirection;
    this.active = isActive;

    if (completeProvider) this.enabled_rules[".*"] = true;
  }

  /**
   * Returns whether redirects should be enforced via a "tabs.update"
   */
  shouldForceRedirect = () => this.forceRedirection;

  /**
   * Returns the provider name.
   */
  getName = () => this.name;

  /**
   * Add URL pattern.
   */
  setURLPattern = (urlPatterns: RegExp | string) => {
    this.urlPattern = new RegExp(urlPatterns, "i");
  };

  /**
   * Return if the Provider Request is canceled
   */
  isCaneling = () => this.canceling;

  /**
   * Check the url is matching the ProviderURL.
   */
  matchURL = (url: string) =>
    this.urlPattern.test(url) && !this.matchException(url);

  /**
   * Apply a rule to a given tuple of rule array.
   * @param enabledRuleArray   for enabled rules
   * @param disabledRulesArray for disabled rules
   * @param rule               RegExp as string
   * @param isActive           Is this rule active?
   */
  applyRule = (
    enabledRuleArray,
    disabledRulesArray,
    rule: string,
    isActive = true,
  ) => {
    if (isActive) {
      enabledRuleArray[rule] = true;

      if (disabledRulesArray[rule] !== undefined) {
        delete disabledRulesArray[rule];
      }
    } else {
      disabledRulesArray[rule] = true;

      if (enabledRuleArray[rule] !== undefined) {
        delete enabledRuleArray[rule];
      }
    }
  };

  /**
   * Add a rule to the rule array
   * and replace old rule with new rule.
   *
   * @param rule     as string
   * @param isActive this rule active?
   */
  addRule = (rule: string, isActive = true) => {
    this.applyRule(this.enabled_rules, this.disabled_rules, rule, isActive);
  };

  /**
   * Return all active rules as an array.
   *
   * @return Array RegExp strings
   */
  getRules = () => {
    if (!storage.referralMarketing) {
      return Object.keys(
        Object.assign(this.enabled_rules, this.enabled_referralMarketing),
      );
    }

    return Object.keys(this.enabled_rules);
  };

  /**
   * Add a raw rule to the raw rule array
   * and replace old raw rule with new raw rule.
   *
   * @param rule     as string
   * @param isActive this rule active?
   */
  addRawRule = (rule: string, isActive = true) => {
    this.applyRule(
      this.enabled_rawRules,
      this.disabled_rawRules,
      rule,
      isActive,
    );
  };

  /**
   * Return all active raw rules as an array.
   *
   * @return Array RegExp strings
   */
  getRawRules = () => Object.keys(this.enabled_rawRules);

  /**
   * Add a referral marketing rule to the referral marketing array
   * and replace old referral marketing rule with new referral marketing rule.
   *
   * @param rule     as string
   * @param isActive this rule active?
   */
  addReferralMarketing = (rule: string, isActive = true) => {
    this.applyRule(
      this.enabled_referralMarketing,
      this.disabled_referralMarketing,
      rule,
      isActive,
    );
  };

  /**
   * Add a exception to the exceptions array
   * and replace old with new exception.
   *
   * @param exception as string
   * @param isActive  Is this exception active?
   */
  addException = (exception: string, isActive = true) => {
    if (isActive) {
      this.enabled_exceptions[exception] = true;

      if (this.disabled_exceptions[exception] !== undefined) {
        delete this.disabled_exceptions[exception];
      }
    } else {
      this.disabled_exceptions[exception] = true;

      if (this.enabled_exceptions[exception] !== undefined) {
        delete this.enabled_exceptions[exception];
      }
    }
  };

  /**
   * Add a HTTP method to methods list.
   *
   * @param method HTTP Method Name
   */
  addMethod = (method: string) => {
    if (!this.methods.includes(method)) {
      this.methods.push(method);
    }
  };

  /**
   * Check the requests' method.
   *
   * @param {requestDetails} details Requests details
   * @returns {boolean} should be filtered or not
   */
  matchMethod = (details) => {
    if (!this.methods.length) return true;
    return this.methods.includes(details["method"]);
  };

  /**
   * Private helper method to check if the url
   * an exception.
   *
   * @param url as string
   * @return matching?
   */
  matchException = (url: string) => {
    let result = false;

    //Add the site blocked alert to every exception
    if (url === siteBlockedAlert) return true;

    for (const exception in this.enabled_exceptions) {
      if (result) break;

      let exception_regex = new RegExp(exception, "i");
      result = exception_regex.test(url);
    }

    return result;
  };

  /**
   * Add a redirection to the redirections array
   * and replace old with new redirection.
   *
   * @param redirection RegExp as string
   * @param isActive    Is this redirection active?
   */
  addRedirection = function (redirection: string, isActive = true) {
    if (isActive) {
      this.enabled_redirections[redirection] = true;

      if (this.disabled_redirections[redirection] !== undefined) {
        delete this.disabled_redirections[redirection];
      }
    } else {
      this.disabled_redirections[redirection] = true;

      if (this.enabled_redirections[redirection] !== undefined) {
        delete this.enabled_redirections[redirection];
      }
    }
  };

  /**
   * Return all redirection.
   *
   * @return url
   */
  getRedirection = (url: string) => {
    let re: string | null = null;

    for (const redirection in this.enabled_redirections) {
      let result = url.match(new RegExp(redirection, "i"));

      if (result && result.length > 0 && redirection) {
        re = new RegExp(redirection, "i").exec(url)[1];

        break;
      }
    }

    return re;
  };
}

const start = () => {
  /**
   * Initialize the JSON provider object keys.
   */
  const getKeys = (obj: Object) => {
    for (const key in obj) {
      prvKeys.push(key);
    }
  };

  /**
   * Initialize the providers form the JSON object.
   *
   */
  const createProviders = () => {
    let data = storage.ClearURLsData;

    for (let p = 0; p < prvKeys.length; p++) {
      //Create new provider
      providers.push(
        new Provider(
          prvKeys[p],
          data.providers[prvKeys[p]].getOrDefault("completeProvider", false),
          data.providers[prvKeys[p]].forceRedirection,
        ),
      );

      //Add URL Pattern
      providers[p].setURLPattern(
        data.providers[prvKeys[p]].getOrDefault("urlPattern", ""),
      );

      let rules = data.providers[prvKeys[p]].getOrDefault("rules", []);
      //Add rules to provider
      for (let r = 0; r < rules.length; r++) {
        providers[p].addRule(rules[r]);
      }

      let rawRules = data.providers[prvKeys[p]].getOrDefault("rawRules", []);
      //Add raw rules to provider
      for (let raw = 0; raw < rawRules.length; raw++) {
        providers[p].addRawRule(rawRules[raw]);
      }

      let referralMarketingRules = data.providers[prvKeys[p]].getOrDefault(
        "referralMarketing",
        [],
      );
      //Add referral marketing rules to provider
      for (
        let referralMarketing = 0;
        referralMarketing < referralMarketingRules.length;
        referralMarketing++
      ) {
        providers[p].addReferralMarketing(
          referralMarketingRules[referralMarketing],
        );
      }

      let exceptions = data.providers[prvKeys[p]].getOrDefault(
        "exceptions",
        [],
      );
      //Add exceptions to provider
      for (let e = 0; e < exceptions.length; e++) {
        providers[p].addException(exceptions[e]);
      }

      let redirections = data.providers[prvKeys[p]].getOrDefault(
        "redirections",
        [],
      );
      //Add redirections to provider
      for (let re = 0; re < redirections.length; re++) {
        providers[p].addRedirection(redirections[re]);
      }

      let methods = data.providers[prvKeys[p]].getOrDefault("methods", []);
      //Add HTTP methods list to provider
      for (let re = 0; re < methods.length; re++) {
        providers[p].addMethod(methods[re]);
      }
    }
  };

  /**
   * Convert the external data to Objects and
   * call the create provider function.
   *
   * @param  {String} retrievedText - pure data form github
   */
  const toObject = (retrievedText: string) => {
    getKeys(storage.ClearURLsData.providers);
    createProviders();
  };

  /**
   * Deactivates ClearURLs, if no rules can be downloaded and also no old rules in storage
   */
  const deactivateOnFailure = () => {
    if (storage.ClearURLsData.length === 0) {
      storage.globalStatus = false;
      storage.dataHash = "";
      storeHashStatus(5);
      saveOnExit();
    }
  };

  /**
   * Get the hash for the rule file on GitLab.
   * Check the hash with the hash form the local file.
   * If the hash has changed, then download the new rule file.
   * Else do nothing.
   */
  const getHash = () => {
    //Get the target hash from GitLab
    const response = fetch(storage.hashURL).then(async (response) => {
      return {
        hash: (await response.text()).trim(),
        status: response.status,
      };
    });

    response
      .then((result) => {
        if (result.status === 200 && result.hash) {
          dataHash = result.hash;

          if (dataHash !== localDataHash.trim()) {
            fetchFromURL();
          } else {
            toObject(storage.ClearURLsData);
            storeHashStatus(1);
            saveOnDisk(["hashStatus"]);
          }
        } else {
          throw "The status code was not okay or the given hash were empty.";
        }
      })
      .catch((error) => {
        console.error(
          "[ClearURLs]: Could not download the rules hash from the given URL due to the following error: ",
          error,
        );
        dataHash = false;
        deactivateOnFailure();
      });
  };

  /*
   * ##################################################################
   * # Fetch Rules & Exception from URL                               #
   * ##################################################################
   */
  const fetchFromURL = () => {
    const response = fetch(storage.ruleURL).then(async (response) => {
      return {
        data: (await response.clone().text()).trim(),
        hash: await sha256((await response.text()).trim()),
        status: response.status,
      };
    });

    response
      .then((result) => {
        if (result.status === 200 && result.data) {
          if (result.hash === dataHash.trim()) {
            storage.ClearURLsData = result.data;
            storage.dataHash = result.hash;
            storeHashStatus(2);
          } else {
            storeHashStatus(3);
            console.error(
              "The hash does not match. Expected `" +
                result.hash +
                "` got `" +
                dataHash.trim() +
                "`",
            );
          }
          storage.ClearURLsData = JSON.parse(storage.ClearURLsData);
          toObject(storage.ClearURLsData);
          saveOnDisk(["ClearURLsData", "dataHash", "hashStatus"]);
        } else {
          throw "The status code was not okay or the given rules were empty.";
        }
      })
      .catch((error) => {
        console.error(
          "[ClearURLs]: Could not download the rules from the given URL due to the following error: ",
          error,
        );
        deactivateOnFailure();
      });
  };

  // }

  // ##################################################################

  /**
   * Function which called from the webRequest to
   * remove the tracking fields from the url.
   *
   * @param  {requestDetails} request     webRequest-Object
   * @return {Array}                  redirectUrl or none
   */
  const clearUrl = (request) => {
    if (storage.globalStatus) {
      let result = {
        changes: false,
        url: "",
        redirect: false,
        cancel: false,
      };

      if (
        storage.pingBlocking &&
        storage.pingRequestTypes.includes(request.type)
      ) {
        return { cancel: true };
      }

      /*
       * Call for every provider the removeFieldsFormURL method.
       */
      for (let i = 0; i < providers.length; i++) {
        if (!providers[i].matchMethod(request)) continue;
        if (providers[i].matchURL(request.url)) {
          result = removeFieldsFormURL(providers[i], request.url);
        }

        /*
         * Expand urls and bypass tracking.
         * Cancel the active request.
         */
        if (result.redirect) {
          if (
            providers[i].shouldForceRedirect() &&
            request.type === "main_frame"
          ) {
            browser.tabs
              .update(request.tabId, { url: result.url })
              .catch(handleError);
            return { cancel: true };
          }

          return {
            redirectUrl: result.url,
          };
        }

        /*
         * Cancel the Request and redirect to the site blocked alert page,
         * to inform the user about the full url blocking.
         */
        if (result.cancel) {
          if (request.type === "main_frame") {
            const blockingPage = browser.runtime.getURL(
              "html/siteBlockedAlert.html?source=" +
                encodeURIComponent(request.url),
            );
            browser.tabs
              .update(request.tabId, { url: blockingPage })
              .catch(handleError);

            return { cancel: true };
          } else {
            return {
              redirectUrl: siteBlockedAlert,
            };
          }
        }

        /*
         * Ensure that the function go not into
         * a loop.
         */
        if (result.changes) {
          return {
            redirectUrl: result.url,
          };
        }
      }
    }

    // Default case
    return {};
  };

  /**
   * Call loadOldDataFromStore, getHash, counter, status and log functions
   */

  loadOldDataFromStore();
  getHash();
};
