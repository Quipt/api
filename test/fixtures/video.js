import base from './base';
import * as fakes from './fakes';
import {base64SafeToBinary} from '../_helpers';

export default class video extends base {
	get defaults() {
		const time = fakes.time();

		return {
			board: fakes.uuidBase64Safe(),
			id: fakes.uuidBase64Safe(),
			owner: fakes.cognitoId(),
			created: time,
			modified: time,
			caption: fakes.words(),
		};
	}

	get Key() {
		return {
			board: {
				B: base64SafeToBinary(this.board)
			},
			id: {
				B: base64SafeToBinary(this.id)
			},
		};
	}

	get Item() {
		return {
			...this.Key,
			owner: {
				S: this.owner
			},
			created: {
				N: this.created.toString()
			},
			modified: {
				N: this.modified.toString()
			},
			caption: {
				S: this.caption
			},
		};
	}
}
