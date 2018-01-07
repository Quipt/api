export default class base {
	constructor(options = {}) {
		for (const [key, value] of Object.entries(this.defaults)) {
			Object.assign(this, {[key]: options[key] || value});
		}
	}

	get defaults() {
		return {};
	}

	get object() {
		return {
			...this,
		};
	}

	// Time to live for automatic clean-up
	get ttl() {
		return {
			ttl: {
				N: (Math.ceil(Date.now() / 1e3) + 300).toString(),
			},
		};
	}
}
