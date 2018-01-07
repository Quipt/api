import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {favoriteTable as TableName} from '../../../../../../_config';
import {request} from '../../../../../../_helpers';
import {cognitoId} from '../../../../../../fixtures/fakes';
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
				'favorites',
				encodeURIComponent(owner),
				board,
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			created,
		},
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
				encodeURIComponent(user),
				'favorites',
				encodeURIComponent(owner),
				'abc',
			].join('/'),
		}
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Invalid request',
		},
		'Invalid body',
	);
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
				encodeURIComponent(cognitoId()),
				'favorites',
				encodeURIComponent(owner),
				board
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Favorite not found',
		},
		'Invalid body',
	);
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
