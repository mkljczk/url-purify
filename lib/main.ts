import { Provider } from "./provider";
import type { SerializedRules } from "./types";

interface URLPurifierConfig {
  hashUrl?: string;
  ruleUrl?: string;
  hashFromMemory?: string;
  rulesFromMemory?: {
    providers: SerializedRules;
  };
  onFetchedRules?: (newHash: string, newRules: string) => void;
  referralMarketing?: boolean;
}

class ClearURLs {
  private referralMarketing: boolean;
  private providers: Record<string, Provider> = {};

  constructor({
    // @ts-ignore
    hashURL = "https://rules2.clearurls.xyz/rules.minify.hash",
    // @ts-ignore
    ruleURL = "https://rules2.clearurls.xyz/data.minify.json",
    // @ts-ignore
    hashFromMemory,
    rulesFromMemory,
    referralMarketing = true,
  }: URLPurifierConfig) {
    this.referralMarketing = referralMarketing;
    if (rulesFromMemory) this.createProviders(rulesFromMemory.providers);
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
      InstanceType<typeof Provider>["removeFieldsFormURL"]
    > = {
      url: url,
      redirect: false,
    };

    /*
     * Call for every provider the removeFieldsFormURL method.
     */
    for (const provider of Object.values(this.providers)) {
      if (provider.matchURL(result.url)) {
        result = provider.removeFieldsFormURL(url);
      }

      /*
       * Ensure that the function go not into a loop.
       */
      if (result.redirect) {
        return result.url;
      }
    }

    // Default case
    return url;
  };
}

export { ClearURLs };
