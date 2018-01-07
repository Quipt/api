import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {userTable as TableName} from '../../_config';
import {request} from '../../_helpers';
import UserFixture from '../../fixtures/user';

const dynamodb = new DynamoDB();
const method = 'GET';

const {
	Key,
	Item,
	id: user,
	object: userObject,
} = new UserFixture();

test.before(() => dynamodb
	.putItem({
		TableName,
		Item,
	})
	.promise()
);

test('Well-formed Request', async () => {
	const {
		statusCode,
		headers,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.ok(+headers['x-total'] > 0, 'Incorrect X-total header value');

	assert.strictEqual(typeof body, 'object', 'body missing');
	assert.ok(Array.isArray(body));

	const responseUser = body.find(item => item.id === user);
	const publicProperties = [
		'id',
		'username',
		'joined',
		'displayname',
	];

	for (const property of publicProperties) {
		assert.strictEqual(responseUser[property], userObject[property]);
	}
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
