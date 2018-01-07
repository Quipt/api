import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import credentials from '../../../../../../../credentials.json';
import {videoTable as TableName} from '../../../../../../../_config';
import {sigv4Request as request} from '../../../../../../../_helpers';
import {uuidBase64Safe} from '../../../../../../../fixtures/fakes';
import VideoFixture from '../../../../../../../fixtures/video';

const user = credentials.SubjectFromWebIdentityToken;
const dynamodb = new DynamoDB();
const method = 'PATCH';

const {
	Key,
	Item,
	board,
	id: video,
	caption,
	modified,
} = new VideoFixture({
	owner: user,
});

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
				'videos',
				video
			].join('/')
		},
		body: {
			caption: `${caption} - Updated`
		}
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');

	assert.strictEqual(typeof body, 'object', 'body missing');
	assert.strictEqual(typeof body.modified, 'number');
	assert.ok(body.modified > modified);
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
				'abc',
				'videos',
				'abc'
			].join('/')
		},
		body: {
			caption: ''
		}
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Invalid request'
		}
	);
});

test('Not found request (board)', async () => {
	const {
		statusCode,
		headers,
		body
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
				'boards',
				uuidBase64Safe(),
				'videos',
				video,
			].join('/')
		},
		body: {
			caption
		}
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Video not found'
		}
	);
});

test('Not found request (video)', async () => {
	const {
		statusCode,
		headers,
		body
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
				'boards',
				board,
				'videos',
				uuidBase64Safe(),
			].join('/')
		},
		body: {
			caption
		}
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Video not found'
		}
	);
});

test.after(() => dynamodb
	.deleteItem({
		TableName,
		Key,
	})
	.promise()
);
