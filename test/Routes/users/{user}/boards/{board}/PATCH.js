import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {boardTable as TableName} from '../../../../../_config';
import {SubjectFromWebIdentityToken as user} from '../../../../../credentials.json';
import {sigv4Request as request} from '../../../../../_helpers';
import {cognitoId, uuidBase64Safe} from '../../../../../fixtures/fakes';
import BoardFixture from '../../../../../fixtures/board';

const dynamodb = new DynamoDB();
const method = 'PATCH';

const {
	Item,
	Key,
	id: board,
} = new BoardFixture({ owner: user });

test.before(() => dynamodb
	.putItem({
		TableName,
		Item,
	})
	.promise()
);

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
				'boards',
				board,
			].join('/'),
		},
		body: {
			name: 'Test Board Patched',
		},
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	// TODO match the data to the response model
	assert.ok(body.modified);
});

test('Invalid request', async () => {
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
				'boards',
				'abcdef',
			].join('/'),
		},
		body: {
			name: 'Test Board Patched',
		},
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Invalid request',
		},
	);
});

test('Not found request', async () => {
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
				'boards',
				uuidBase64Safe(),
			].join('/'),
		},
		body: {
			name: 'Test Board Patched',
		},
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Board not found',
		},
	);
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
