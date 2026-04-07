import type { RedirectMapping } from './redirect-mappings';
import type { Cleaned, InstancePickMode, SerializedService } from './types';

class RedirectProvider {
	private urlPattern: RegExp;
	private instances: Array<string>;
	private mode: InstancePickMode;

	constructor(
		mapping: RedirectMapping,
		mappedServices: Array<SerializedService>,
		mode: InstancePickMode = 'first',
	) {
		this.urlPattern = new RegExp(mapping.urlPattern, 'i');
		this.instances = mappedServices.flatMap((service) => service.instances);
		this.mode = mode;
	}

	matchURL = (url: string) => this.urlPattern.test(url);

	redirectURL = (url: string): Cleaned => {
		const urlObject = new URL(url);

		const domain =
			this.mode === 'first'
				? this.instances[0]
				: this.instances[Math.floor(Math.random() * this.instances.length)];

		if (!domain) {
			return {
				url,
				changes: 0,
				redirect: false,
			};
		}

		const domainUrl = new URL(domain.split('|')[0]);

		urlObject.host = domainUrl.host;
		urlObject.protocol = domainUrl.protocol;

		return {
			url: urlObject.toString(),
			changes: 1,
			redirect: true,
		};
	};
}

export { RedirectProvider };
