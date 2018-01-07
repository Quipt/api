import base from './base';
import * as fakes from './fakes';
import {base64SafeToBinary} from '../_helpers';

export default class board extends base {
	get defaults() {
		const time = fakes.time();

		return {
			owner: fakes.cognitoId(),
			id: fakes.uuidBase64Safe(),
			created: time,
			modified: time,
			name: fakes.words(),
		};
	}

	get Key() {
		return {
			owner: {
				S: this.owner
			},
			id: {
				B: base64SafeToBinary(this.id)
			}
		};
	}

	get Item() {
		return {
			...this.Key,
			...this.ttl,
			name: {
				S: this.name
			},
			created: {
				N: this.created.toString()
			},
			modified: {
				N: this.modified.toString()
			}
		};
	}
}
