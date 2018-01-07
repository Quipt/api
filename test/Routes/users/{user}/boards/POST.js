import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {boardTable as TableName} from '../../../../_config';
import {SubjectFromWebIdentityToken as user} from '../../../../credentials.json';
import {sigv4Request as request} from '../../../../_helpers';
import BoardFixture from '../../../../fixtures/board';

const dynamodb = new DynamoDB();
const method = 'POST';

let board;

test('Well-formed request', async () => {
	const {
		statusCode,
		headers,
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
				'boards',
			].join('/'),
		},
		body: {
			name: 'TEST BOARD POST',
		},
	});

	assert.strictEqual(statusCode, 201, 'Incorrect HTTP status code');

	// TODO match the data to the response model

	board = headers.location;
});

test('Missing body', async () => {
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
		},
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
});

test.after(async () => {
	const { Key } = new BoardFixture({
		owner: user,
		id: board,
	});
	
	return dynamodb
		.deleteItem({
			TableName,
			Key,
		})
		.promise();
});
