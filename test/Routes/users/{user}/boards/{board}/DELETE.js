import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {boardTable as TableName} from '../../../../../_config';
import {SubjectFromWebIdentityToken as user} from '../../../../../credentials.json';
import {sigv4Request as request} from '../../../../../_helpers';
import {cognitoId, uuidBase64Safe} from '../../../../../fixtures/fakes';
import BoardFixture from '../../../../../fixtures/board';

const dynamodb = new DynamoDB();
const method = 'DELETE';

const {
	Item,
	Key,
	id: board
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
			].join('/')
		}
	});

	assert.strictEqual(statusCode, 204, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(body, null, 'Body is not empty');
});

// TODO 401

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
			].join('/')
		}
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Board not found'
		},
		'Incorrect error message'
	);
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
