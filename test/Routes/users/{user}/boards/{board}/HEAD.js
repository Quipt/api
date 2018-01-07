import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {boardTable as TableName} from '../../../../../_config';
import {request} from '../../../../../_helpers';
import {cognitoId} from '../../../../../fixtures/fakes';
import BoardFixture from '../../../../../fixtures/board';

const dynamodb = new DynamoDB();
const method = 'HEAD';

const {
	Item,
	Key,
	owner: user,
	id: board,
} = new BoardFixture();

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
		}
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(body, null, 'Body is not empty');
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
				'abcdef',
				'boards',
				board,
			].join('/'),
		}
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(body, null, 'Body is not empty');
});

test('Not found request', async () => {
	const {
		statusCode,
		headers,
		body
	} = await request({
		options: {
			method,
			path: [
				'users',
				cognitoId(),
				'boards',
				board
			].join('/'),
		}
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(body, null, 'Body is not empty');
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
