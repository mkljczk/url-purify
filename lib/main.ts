import { Provider } from './provider';
import { sha256 } from './tools';
import type { SerializedProvider, SerializedRules } from './types';

interface URLPurifyConfig {
  /** URL for up-to-date URL cleaning rules */
  ruleUrl?: string;
  /** Previously fetched URL cleaning rules */
  rulesFromMemory?: SerializedRules;
  /** URL for sha256 hash of the up-to-date ruleset */
  hashUrl?: string;
  /** sha256 hash of a previously fetched ruleset */
  hashFromMemory?: string;
  /** Callback function to be called when new rules are fetched */
  onFetchedRules?: (newHash: string, newRules: SerializedRules) => void;
  /** Remove referral marketing parameters from URLs */
  referralMarketing?: boolean;
}

class URLPurify {
  private referralMarketing: boolean;
  private onFetchedRules?: (newHash: string, newRules: SerializedRules) => void;

  private providers: Record<string, Provider> = {};

  constructor({
    hashUrl,
    ruleUrl,
    hashFromMemory,
    rulesFromMemory,
    onFetchedRules,
    referralMarketing = true,
  }: URLPurifyConfig) {
    if (!ruleUrl && !rulesFromMemory)
      throw new Error(
        'Either rule URL or a prefetched ruleset must be provided',
      );

    this.referralMarketing = referralMarketing;
    this.onFetchedRules = onFetchedRules;

    if (rulesFromMemory) this.createProviders(rulesFromMemory);

    if (ruleUrl) {
      if (hashFromMemory && hashUrl) {
        this.fetchHash(hashUrl).then((newHash) => {
          if (newHash !== hashFromMemory) {
            this.fetchRules(ruleUrl).then(this.createProviders);
          }
        });
      } else {
        this.fetchRules(ruleUrl).then(this.createProviders);
      }
    }
  }

  private createProviders = (rules: SerializedRules) => {
    this.providers = {};

    for (const [name, provider] of Object.entries(rules.providers)) {
      this.providers[name] = new Provider(
        name,
        provider,
        this.referralMarketing,
      );
    }
  };

  /**
   * Clears tracking elements from a URL.
   * @param url - The URL to clear tracking elements from.
   * @returns URL without tracking elements.
   */
  clearUrl = (url: string) => {
    let result: ReturnType<
      InstanceType<typeof Provider>['removeFieldsFormURL']
    > = {
      url: url,
      redirect: false,
    };

    /*
     * Call the removeFieldsFormURL method for every provider.
     */
    for (const provider of Object.values(this.providers)) {
      if (provider.matchURL(result.url)) {
        result = provider.removeFieldsFormURL(result.url);
      }

      /*
       * Ensure that the function doesn't get into a loop.
       */
      if (result.redirect) {
        return result.url;
      }
    }

    // Default case
    return result.url;
  };

  /**
    * Sets rules provided by the user.
    * @param rules - The rules object.
    * @param _hash - The sha256 hash of the rules object (currently unused).
    */
  setRules = (rules: SerializedRules, _hash?: string) => {
    this.createProviders(rules);
  };

  /**
    * Sets the URLs for rules database and hash source.
    * @param ruleUrl - The URL for the rules database.
    * @param _hashUrl - The URL for the hash source (currently unused).
    */
  setUrls = (ruleUrl: string, _hashUrl?: string) => {
    this.fetchRules(ruleUrl).then(this.createProviders);
  };

  private fetchHash = async (url: string) => {
    const response = await fetch(url);
    return await response.text();
  };

  private fetchRules = async (url: string): Promise<SerializedRules> => {
    const response = await fetch(url);
    const rulesText = await response.text();
    const rules = JSON.parse(rulesText);

    sha256(rulesText).then((hash) => {
      if (this.onFetchedRules) {
        this.onFetchedRules(hash, rules);
      }
    });

    return rules;
  };
}

export {
  URLPurify,
  type URLPurifyConfig,
  type SerializedRules,
  type SerializedProvider,
};
