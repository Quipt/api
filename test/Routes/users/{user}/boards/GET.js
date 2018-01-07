import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {boardTable as TableName} from '../../../../_config';
import {request, toBase64Safe} from '../../../../_helpers';
import BoardFixture from '../../../../fixtures/board';

const dynamodb = new DynamoDB();
const method = 'GET';

const {
	Item,
	Key,
	owner: user,
	id,
	created,
	modified,
	name,
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
			].join('/'),
		}
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(headers['x-total'], '1');
	assert.deepStrictEqual(
		body,
		[
			{
				id,
				created,
				modified,
				name,
			},
		],
	);

	// TODO match the data to the response model
});

test('Malformed request', async () => {
	const {
		statusCode
	} = await request({
		options: {
			method,
			path: [
				'users',
				'abcedf',
				'boards',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
