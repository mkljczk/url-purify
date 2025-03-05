import { Provider } from './provider';
import type { SerializedRules } from './types';

interface URLPurifyConfig {
  hashUrl?: string;
  ruleUrl?: string;
  hashFromMemory?: string;
  rulesFromMemory?: SerializedRules;
  onFetchedRules?: (newHash: string, newRules: string) => void;
  referralMarketing?: boolean;
}

class URLPurify {
  private referralMarketing: boolean;
  private providers: Record<string, Provider> = {};

  constructor({
    // @ts-ignore
    hashURL = 'https://rules2.clearurls.xyz/rules.minify.hash',
    // @ts-ignore
    ruleURL = 'https://rules2.clearurls.xyz/data.minify.json',
    // @ts-ignore
    hashFromMemory,
    rulesFromMemory,
    referralMarketing = true,
  }: URLPurifyConfig) {
    this.referralMarketing = referralMarketing;
    if (rulesFromMemory) this.createProviders(rulesFromMemory);
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
}

export { URLPurify };
