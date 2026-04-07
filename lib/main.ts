import { Provider } from './provider';
import { mappings } from './redirect-mappings';
import { RedirectProvider } from './redirect-provider';
import { sha256 } from './tools';
import type {
	Cleaned,
	InstancePickMode,
	RedirectMapping,
	SerializedProvider,
	SerializedRules,
	SerializedService,
	SerializedServices,
} from './types';

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

export class URLPurify {
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
		if (
			!ruleUrl &&
			!rulesFromMemory &&
			!redirectServicesUrl &&
			!redirectServicesFromMemory
		)
			throw new Error(
				'Either rule URL or a prefetched ruleset must be provided',
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
		for (const mapping of mappings) {
			const mappedServices = services.filter((service) =>
				mapping.targets.includes(service.type),
			);

			this.redirectProviders[mapping.name] = new RedirectProvider(
				mapping,
				mappedServices,
				this.instancePickMode,
			);
		}
	};

	/**
	 * Clears tracking elements from a URL.
	 * @param url - The URL to clear tracking elements from.
	 * @param removeFields - Whether to remove tracking fields from the URL.
	 * @param redirect - Whether to redirect to one of available proxy services.
	 * @returns URL without tracking elements.
	 */
	clearUrl = (url: string, removeFields = true, redirect = true): Cleaned => {
		let totalChanges = 0;
		let result: Cleaned = {
			url: url,
			redirect: false,
			changes: 0,
		};

		if (removeFields) {
			/*
			 * Call the removeFieldsFromURL method for every provider.
			 */
			for (const provider of Object.values(this.providers)) {
				if (provider.matchURL(result.url)) {
					result = provider.removeFieldsFromURL(result.url);
					if (result.changes) totalChanges += result.changes;
				}

				/*
				 * Ensure that the function doesn't get into a loop.
				 */
				if (result.redirect) {
					return {
						url: result.url,
						changes: totalChanges,
						redirect: result.redirect,
					};
				}
			}
		}

		if (redirect) {
			for (const provider of Object.values(this.redirectProviders)) {
				if (provider.matchURL(result.url)) {
					result = provider.redirectURL(result.url);
					if (result.changes) totalChanges += result.changes;
				}
			}
		}

		// Default case
		return {
			url: result.url,
			changes: totalChanges,
			redirect: false,
		};
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

///// Worker functions

let purifyCached: URLPurify | undefined;

/**
 * call and await init to create a singleton URLPurify instance.
 * It will download rules from rules2.clearurls.xyz.
 *
 * Calling a second time will return the already initialized singleton.
 */
export async function init() {
	if (purifyCached) return purifyCached;
	let resolver: (val: unknown) => void;
	const promise = new Promise((resolve) => {
		resolver = resolve;
	});
	const purify = new URLPurify({
		hashUrl: 'https://rules2.clearurls.xyz/rules.minify.hash',
		ruleUrl: 'https://rules2.clearurls.xyz/data.minify.json',
		onFetchedRules: () => {
			resolver('loaded');
		},
	});
	await promise;
	purifyCached = purify;
	return purify;
}

// from chatGPT. Originally used https://github.com/Quehnie/youtube-id-regex/blob/main/index.js but it didn't work
const youTubeRegex =
	/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|(?:watch\?.*?[?&]v=)|(?:v\/)|(?:(?!c\/).+\/)|(?:.*[?&]v=)|(?:\S*?[?&]v=)|\S*?\/)?|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/;

const supportedYouTubeEmbedParams = new Set([
	'autoplay',
	'cc_lang_pref',
	'cc_load_policy',
	'color',
	'controls',
	'disablekb',
	'enablejsapi',
	'end',
	'fs',
	'hl',
	'iv_load_policy',
	'list',
	'listType',
	'loop',
	'modestbranding',
	'origin',
	'playlist',
	'playsinline',
	'rel',
	'start',
	'widget_referrer',
]);

function parseYouTubeTimeToSeconds(value: string) {
	if (/^\d+$/.test(value)) return value;

	const match = value.match(
		/^(?:(?<hours>\d+)h)?(?:(?<minutes>\d+)m)?(?:(?<seconds>\d+)s)?$/,
	);
	if (!match?.groups) return;

	const hours = Number(match.groups.hours ?? '0');
	const minutes = Number(match.groups.minutes ?? '0');
	const seconds = Number(match.groups.seconds ?? '0');
	const totalSeconds = hours * 3600 + minutes * 60 + seconds;

	return totalSeconds > 0 ? String(totalSeconds) : undefined;
}

function buildYouTubeEmbedUrl(url: string, ytId: string) {
	const inputUrl = new URL(url);
	const embedParams = new URLSearchParams();

	embedParams.set('mute', '1');
	embedParams.set('autoplay', '1');

	for (const [key, value] of inputUrl.searchParams.entries()) {
		if (supportedYouTubeEmbedParams.has(key)) {
			embedParams.set(key, value);
		}
	}

	const startParam =
		inputUrl.searchParams.get('start') ??
		inputUrl.searchParams.get('t') ??
		inputUrl.searchParams.get('time_continue');
	const startSeconds = startParam
		? parseYouTubeTimeToSeconds(startParam)
		: undefined;

	if (startSeconds) {
		embedParams.set('start', startSeconds);
	}

	if (
		embedParams.get('loop') === '1' &&
		!embedParams.has('playlist') &&
		!embedParams.has('list') &&
		ytId
	) {
		embedParams.set('playlist', ytId);
	}

	return `https://www.youtube-nocookie.com/embed/${ytId}?${embedParams.toString()}`;
}

/** cleanURL provides a simple function to clean a URL. It calls init() if required. */
export async function cleanURL(url: string) {
	const purify = await init();
	const cleaned = purify.clearUrl(url, true, false);
	if (youTubeRegex.test(cleaned.url)) {
		const yt_id = youTubeRegex.exec(cleaned.url)?.[1];
		if (!yt_id) return cleaned;
		cleaned.youtube_id = yt_id;
		const tParam = new URL(cleaned.url).searchParams.get('t');
		cleaned.url = `https://www.youtube.com/watch?v=${yt_id}${tParam ? `&t=${tParam}` : ''}`;

		cleaned.embed_url = buildYouTubeEmbedUrl(url, yt_id);
	}
	return cleaned;
}

export type {
	Cleaned,
	InstancePickMode,
	RedirectMapping,
	SerializedProvider,
	SerializedRules,
	SerializedService,
	SerializedServices,
	URLPurifyConfig,
};
