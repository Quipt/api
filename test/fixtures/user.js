import base from './base';
import * as fakes from './fakes';

export default class user extends base {
	get defaults() {
		const time = fakes.time();

		return {
			id: fakes.cognitoId(),
			username: fakes.username(),
			displayname: fakes.name(),
			email: fakes.email(),
			subscribe: fakes.boolean(),
			created: time,
			modified: time,
		};
	}

	get Key() {
		return {
			id: {
				S: this.id
			}
		};
	}

	get Item() {
		return {
			...this.Key,
			...this.ttl,
			displayname: {
				S: this.displayname
			},
			email: {
				S: this.email
			},
			created: {
				N: this.created.toString()
			},
			modified: {
				N: this.modified.toString()
			},
			subscribe: {
				BOOL: !!this.subscribe
			},
			username: {
				S: this.username
			}
		};
	}
}