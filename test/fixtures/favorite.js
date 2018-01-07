import base from './base';
import * as fakes from './fakes';
import {base64SafeToBinary} from '../_helpers';

export default class favorite extends base {
	get defaults() {
		return {
			user: fakes.cognitoId(),
			owner: fakes.cognitoId(),
			board: fakes.uuidBase64Safe(),
			created: fakes.time(),
		};
	}

	get Key() {
		return {
			user: {
				S: this.user
			},
			board: {
				B: base64SafeToBinary(this.board)
			}
		};
	}

	get Item() {
		return {
			...this.Key,
			...this.ttl,
			owner: {
				S: this.owner
			},
			created: {
				N: this.created.toString()
			}
		};
	}
}
