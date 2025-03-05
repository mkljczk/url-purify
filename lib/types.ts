interface SerializedRules {
  providers: Record<string, SerializedProvider>;
}

interface SerializedProvider {
  urlPattern: string;
  exceptions?: Array<string>;
  rawRules?: Array<string>;
  redirections?: Array<string>;
  referralMarketing?: Array<string>;
  rules?: Array<string>;
  completeProvider?: boolean;
  forceRedirection?: boolean;
}

export type { SerializedRules, SerializedProvider };
