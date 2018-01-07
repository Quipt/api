import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {favoriteTable as TableName} from '../../../../_config';
import {request, putRequest, deleteRequest} from '../../../../_helpers';
import UserFixture from '../../../../fixtures/user';
import FavoriteFixture from '../../../../fixtures/favorite';

const dynamodb = new DynamoDB();
const method = 'HEAD';

const { id: user } = new UserFixture();
const favorites = new Array(3)
	.fill()
	.map(() => new FavoriteFixture({ user }));

test.before(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[TableName]: favorites
				.map(({Item}) => putRequest(Item)),
		},
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
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(headers['x-total'], favorites.length.toString());
	assert.strictEqual(body, null, 'Body is not empty');
});

test('Malformed request', async () => {
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
				'favorites',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(body, null, 'Body is not empty');
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[TableName]: favorites
				.map(({Key}) => deleteRequest(Key)),
		},
	})
	.promise()
);
