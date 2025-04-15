import { Provider } from "./provider";
import { mappings } from "./redirect-mappings";
import { RedirectProvider } from "./redirect-provider";
import { sha256 } from "./tools";
import type {
  InstancePickMode,
  SerializedProvider,
  SerializedRules,
  SerializedServices,
} from "./types";

interface URLPurifyConfig {
  /** URL for up-to-date URL cleaning rules */
  ruleUrl?: string;
  /** Previously fetched URL cleaning rules */
  rulesFromMemory?: SerializedRules;
  /** URL for sha256 hash of the up-to-date ruleset */
  hashUrl?: string;
  /** sha256 hash of a previously fetched ruleset */
  hashFromMemory?: string;
  /** URL for up-to-date redirect services URLs */
  redirectServicesUrl?: string;
  /** Previously fetched redirect services URLs */
  redirectServicesFromMemory?: SerializedServices;
  /** Callback function to be called when new rules are fetched */
  onFetchedRules?: (newHash: string, newRules: SerializedRules) => void;
  /** Callback function to be called when new redirect services URLs are fetched */
  onFetchedRedirectServices?: (newServices: SerializedServices) => void;
  /** Remove referral marketing parameters from URLs */
  referralMarketing?: boolean;
  /** Whether to select the first available instance or pick a random one */
  instancePickMode?: InstancePickMode;
}

class URLPurify {
  private referralMarketing: boolean;
  private instancePickMode: InstancePickMode;
  private onFetchedRules?: (newHash: string, newRules: SerializedRules) => void;
  private onFetchedRedirectServices?: (newServices: SerializedServices) => void;

  private providers: Record<string, Provider> = {};
  private redirectProviders: Record<string, RedirectProvider> = {};

  constructor({
    hashUrl,
    ruleUrl,
    hashFromMemory,
    rulesFromMemory,
    onFetchedRules,
    onFetchedRedirectServices,
    referralMarketing = true,
    redirectServicesUrl,
    redirectServicesFromMemory,
    instancePickMode = 'first',
  }: URLPurifyConfig) {
    if (!ruleUrl && !rulesFromMemory && !redirectServicesUrl && !redirectServicesFromMemory)
      throw new Error(
        "Either rule URL or a prefetched ruleset must be provided",
      );

    this.referralMarketing = referralMarketing;
    this.instancePickMode = instancePickMode;
    this.onFetchedRules = onFetchedRules;
    this.onFetchedRedirectServices = onFetchedRedirectServices;

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

    if (redirectServicesFromMemory)
      this.createRedirectProviders(redirectServicesFromMemory);

    if (redirectServicesUrl) {
      this.fetchRedirectServices(redirectServicesUrl).then(
        this.createRedirectProviders,
      );
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

  private createRedirectProviders = (services: SerializedServices) => {
    this.redirectProviders = {};

    mappings.forEach((mapping) => {
      const mappedServices = services.filter((service) =>
        mapping.targets.includes(service.type),
      );

      this.redirectProviders[mapping.name] = new RedirectProvider(
        mapping,
        mappedServices,
        this.instancePickMode,
      );
    });
  };

  /**
   * Clears tracking elements from a URL.
   * @param url - The URL to clear tracking elements from.
   * @param removeFields - Whether to remove tracking fields from the URL.
   * @param redirect - Whether to redirect to one of available proxy services.
   * @returns URL without tracking elements.
   */
  clearUrl = (url: string, removeFields = true, redirect = true) => {
    let result: ReturnType<
      InstanceType<typeof Provider>["removeFieldsFormURL"]
    > = {
      url: url,
      redirect: false,
    };

    if (removeFields) {
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
    }

    if (redirect) {
      for (const provider of Object.values(this.redirectProviders)) {
        if (provider.matchURL(result.url)) {
          result = provider.redirectURL(result.url);
        }
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

  /**
  * Sets redirect services provided by the user.
  * @param redirectServices - The list of redirect services.
  */
  setRedirectServices = (redirectServices: SerializedServices) => {
    this.createRedirectProviders(redirectServices);
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

  private fetchRedirectServices = async (
    url: string,
  ): Promise<SerializedServices> => {
    const response = await fetch(url);
    const servicesText = await response.text();
    const services = JSON.parse(servicesText);

    if (this.onFetchedRedirectServices) {
      this.onFetchedRedirectServices(services);
    }

    return services;
  };
}

export {
  URLPurify,
  mappings,
  type SerializedProvider,
  type SerializedRules,
  type SerializedServices,
  type URLPurifyConfig,
};
