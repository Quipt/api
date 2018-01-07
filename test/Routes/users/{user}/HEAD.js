import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {userTable as TableName} from '../../../_config';
import {request} from '../../../_helpers';
import UserFixture from '../../../fixtures/user';

const dynamodb = new DynamoDB();
const method = 'HEAD';

const {
	Item,
	Key,
	id: user,
	username,
} = new UserFixture();

test.before(() => dynamodb
	.putItem({
		TableName,
		Item,
	})
	.promise()
);

test('Request by UserID', async () => {
	const {
		statusCode,
		body
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.strictEqual(body, null, 'Body is not empty');
});

test('Request by Username', async () => {
	const {
		statusCode,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
				`@${username}`,
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.strictEqual(body, null, 'Body is not empty');
});

test('Malformed request', async () => {
	const {
		statusCode,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
				'abcedf',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');

	// TODO write tests for headers

	assert.strictEqual(body, null, 'Body is not empty');
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
