import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {favoriteTable as TableName} from '../../../../../../_config';
import {request} from '../../../../../../_helpers';
import FavoriteFixture from '../../../../../../fixtures/favorite';

const dynamodb = new DynamoDB();

const method = 'GET';

const {
	Key,
	Item,
	user,
	owner,
	board,
	created,
} = new FavoriteFixture();

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
				'favorites',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.ok(headers['access-control-expose-headers']);
	assert.ok(headers['x-total']);

	// TODO match the data to the response model

	assert.deepStrictEqual(
		body,
		[
			{
				owner,
				created,
			},
		],
	);
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
				'abcdef',
				'favorites',
			].join('/'),
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

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key: Key,
	})
	.promise()
);
