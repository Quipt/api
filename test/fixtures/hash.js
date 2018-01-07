import base from './base';
import * as fakes from './fakes';
import {base64SafeToBinary} from '../_helpers';

export default class hash extends base {
	get defaults() {
		return {
			hash: fakes.sha256(),
			id: fakes.uuidBase64Safe(),
			user: fakes.cognitoId(),
			created: fakes.time(),
			uploadPending: undefined,
		};
	}

	get Key() {
		return {
			hash: {
				B: Buffer.from(this.hash, 'hex'),
			},
		};
	}

	get Item() {
		return {
			...this.Key,
			...this.ttl,
			id: {
				B: base64SafeToBinary(this.id)
			},
			user: {
				S: this.user
			},
			created: {
				N: this.created.toString(),
			},
			...(
				this.uploadPending ?
					{
						uploadPending: {
							NULL: true
						}
					} :
					{}
			)
		};
	}
}
