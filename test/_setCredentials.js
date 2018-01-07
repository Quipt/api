import fs from 'fs';
import path from 'path';

import {WebIdentityCredentials} from 'aws-sdk';
import CognitoIdentity from 'aws-sdk/clients/cognitoidentity';

import {cognito} from './_config';

const {params, RoleArn} = cognito;
const cognitoidentity = new CognitoIdentity();

(async () => {
	try {
		const {Token: WebIdentityToken} = await cognitoidentity
			.getOpenIdTokenForDeveloperIdentity(params)
			.promise();

		const creds = new WebIdentityCredentials({
			RoleArn,
			WebIdentityToken,
		});

		const data = await new Promise((resolve, reject) => {
			creds.get(err => err ? reject(err) : resolve(creds.data))
		});

		fs.writeFileSync(
			path.join(__dirname, 'credentials.json'),
			JSON.stringify(data, null, '\t')
		);
	} catch (error) {
		console.error(error);
	}
})();
