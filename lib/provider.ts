import {
  decodeURL,
  extractFragments,
  urlSearchParamsToString,
  urlWithoutParamsAndHash,
} from './tools';
import type { SerializedProvider } from './types';
import type { URLHashParams } from './utils/URLHashParams';

class Provider {
  // @ts-ignore
  private name: string;
  // @ts-ignore
  private urlPattern: RegExp;
  private enabled_rules: Record<string, boolean> = {};
  private enabled_exceptions: Record<string, boolean> = {};
  private enabled_redirections: Record<string, boolean> = {};
  private enabled_rawRules: Record<string, boolean> = {};
  private enabled_referralMarketing: Record<string, boolean> = {};
  private referralMarketing: boolean;

  /**
   * Declare constructor
   */
  constructor(
    name: string,
    {
      completeProvider = false,
      urlPattern,
      rules = [],
      rawRules = [],
      referralMarketing: referralMarketingRules = [],
      exceptions = [],
      redirections = [],
    }: SerializedProvider,
    referralMarketing = true,
  ) {
    this.name = name;

    if (completeProvider) this.enabled_rules['.*'] = true;

    //Add URL Pattern
    this.setURLPattern(urlPattern);

    //Add rules to provider
    for (const rule of rules) {
      this.addRule(rule);
    }

    //Add raw rules to provider
    for (const rawRule of rawRules) {
      this.addRawRule(rawRule);
    }

    //Add referral marketing rules to provider
    for (const referralMarketingRule of referralMarketingRules) {
      this.addReferralMarketing(referralMarketingRule);
    }

    //Add exceptions to provider
    for (const exception of exceptions) {
      this.addException(exception);
    }

    //Add redirections to provider
    for (const redirection of redirections) {
      this.addRedirection(redirection);
    }

    this.referralMarketing = referralMarketing;
  }

  /**
   * Add URL pattern.
   */
  private setURLPattern = (urlPatterns: RegExp | string) => {
    this.urlPattern = new RegExp(urlPatterns, 'i');
  };

  /**
   * Apply a rule to a given tuple of rule array.
   * @param enabledRuleArray   for enabled rules
   * @param rule               RegExp as string
   */
  private applyRule = (
    enabledRuleArray: Record<string, boolean>,
    rule: string,
  ) => {
    enabledRuleArray[rule] = true;
  };

  /**
   * Add a rule to the rule array
   * and replace old rule with new rule.
   *
   * @param rule as string
   */
  private addRule = (rule: string) => {
    this.applyRule(this.enabled_rules, rule);
  };

  /**
   * Return all active rules as an array.
   *
   * @return Array RegExp strings
   */
  private getRules = () => {
    if (!this.referralMarketing) {
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
   */
  private addRawRule = (rule: string) => {
    this.applyRule(this.enabled_rawRules, rule);
  };

  /**
   * Return all active raw rules as an array.
   *
   * @return Array RegExp strings
   */
  private getRawRules = () => Object.keys(this.enabled_rawRules);

  /**
   * Add a referral marketing rule to the referral marketing array
   * and replace old referral marketing rule with new referral marketing rule.
   *
   * @param rule     as string
   * @param isActive this rule active?
   */
  private addReferralMarketing = (rule: string) => {
    this.applyRule(this.enabled_referralMarketing, rule);
  };

  /**
   * Add a exception to the exceptions array
   * and replace old with new exception.
   *
   * @param exception as string
   * @param isActive  Is this exception active?
   */
  private addException = (exception: string) => {
    this.enabled_exceptions[exception] = true;
  };

  /**
   * Private helper method to check if the url
   * an exception.
   *
   * @param url as string
   * @return matching?
   */
  private matchException = (url: string) => {
    let result = false;

    for (const exception in this.enabled_exceptions) {
      if (result) break;

      const exception_regex = new RegExp(exception, 'i');
      result = exception_regex.test(url);
    }

    return result;
  };

  /**
   * Add a redirection to the redirections array
   * and replace old with new redirection.
   *
   * @param redirection RegExp as string
   */
  private addRedirection = (redirection: string) => {
    this.enabled_redirections[redirection] = true;
  };

  /**
   * Return all redirection.
   *
   * @return url
   */
  private getRedirection = (url: string) => {
    let re: string | null = null;

    for (const redirection in this.enabled_redirections) {
      const result = url.match(new RegExp(redirection, 'i'));

      if (result && result.length > 0 && redirection) {
        re = new RegExp(redirection, 'i').exec(url)?.[1] || null;

        break;
      }
    }

    return re;
  };

  getName = () => {
    return this.name;
  };

  /**
   * Check the url is matching the ProviderURL.
   */
  matchURL = (url: string) =>
    this.urlPattern.test(url) && !this.matchException(url);

  /**
   * Helper function whichs remove the tracking fields
   * for each provider given as parameter.
   *
   * @param pureUrl   URL as String
   * @return Array with changes and url fields
   */
  removeFieldsFormURL = (
    pureUrl: string,
  ): {
    url: string;
    changes?: boolean;
    redirect?: boolean;
  } => {
    let url = pureUrl;
    let domain = '';
    let fragments: URLHashParams;
    let fields: URLSearchParams;
    const rules = this.getRules();
    let changes = false;
    const rawRules = this.getRawRules();
    let urlObject = new URL(url);

    /*
     * Expand the url by provider redirections. So no tracking on
     * url redirections form sites to sites.
     */
    const re = this.getRedirection(url);
    if (re !== null) {
      url = decodeURL(re);

      return {
        redirect: true,
        url: url,
      };
    }

    /*
     * Apply raw rules to the URL.
     */
    for (const rawRule of rawRules) {
      const beforeReplace = url;
      url = url.replace(new RegExp(rawRule, 'gi'), '');

      if (beforeReplace !== url) {
        changes = true;
      }
    }

    urlObject = new URL(url);
    fields = urlObject.searchParams;
    fragments = extractFragments(urlObject);
    domain = urlWithoutParamsAndHash(urlObject).toString();

    /**
     * Only test for matches, if there are fields or fragments that can be cleaned.
     */
    if (fields.toString() !== '' || fragments.toString() !== '') {
      for (const rule of rules) {
        for (const field of fields.keys()) {
          if (new RegExp(`^${rule}$`, 'gi').test(field)) {
            fields.delete(field);
            changes = true;
          }
        }

        for (const fragment of fragments.keys()) {
          if (new RegExp(`^${rule}$`, 'gi').test(fragment)) {
            fragments.delete(fragment);
            changes = true;
          }
        }
      }

      let finalURL = domain;

      if (fields.toString() !== '')
        finalURL += `?${urlSearchParamsToString(fields)}`;
      if (fragments.toString() !== '') finalURL += `#${fragments.toString()}`;

      url = finalURL.replace(/\?&/, '?').replace(/#&/, '#');
    }

    return {
      changes: changes,
      url: url,
    };
  };
}

export { Provider };
