import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {userTable as TableName} from '../../../_config';
import {request} from '../../../_helpers';
import UserFixture from '../../../fixtures/user';

const dynamodb = new DynamoDB();
const method = 'GET';

const {
	Item,
	Key,
	id: user,
	username,
	created,
	displayname,
	email,
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
				encodeURIComponent(user)
			].join('/')
		}
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.strictEqual(typeof body, 'object', 'body missing');
	assert.strictEqual(body.username, username);
	assert.strictEqual(body.created, created);
	assert.strictEqual(body.displayname, displayname);
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
				`@${username}`
			].join('/'),
		}
	});

	// TODO write tests for headers

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.strictEqual(typeof body, 'object', 'body missing');
	assert.strictEqual(body.id, user);
	assert.strictEqual(body.created, created);
	assert.strictEqual(body.displayname, displayname);
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
			].join('/')
		}
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');

	// TODO write tests for headers

	assert.ok(body.message, 'Error message doesn\'t exist');
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
