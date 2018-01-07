import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {userTable as TableName} from '../../../_config';
import {SubjectFromWebIdentityToken as user} from '../../../credentials.json';
import {sigv4Request as request} from '../../../_helpers';
import UserFixture from '../../../fixtures/user';

const dynamodb = new DynamoDB();
const method = 'PUT';

const {
	Item,
	Key,
	username,
	created,
	displayname,
	email,
	subscribe,
} = new UserFixture({ id: user });

test('Well-formed request', async () => {
	const {
		statusCode,
		headers,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
			].join('/'),
		},
		body: {
			username,
			displayname,
			email,
			subscribe,
		},
	});

	assert.strictEqual(statusCode, 201, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Incorrect Access-Control-Allow-Origin header');
	assert.ok(body);
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
