import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {videoTable as TableName} from '../../../../../../../_config';
import {request} from '../../../../../../../_helpers';
import {uuidBase64Safe, cognitoId} from '../../../../../../../fixtures/fakes';
import VideoFixture from '../../../../../../../fixtures/video';

const dynamodb = new DynamoDB();
const method = 'GET';

const {
	Key,
	Item,
	board,
	owner: user,
	id: video,
	created,
	modified,
	caption,
} = new VideoFixture();

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
				video
			].join('/')
		}
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			created,
			modified,
			caption,
		}
	);
});

test('Invalid request', async () => {
	const {
		statusCode,
		headers,
		body
	} = await request({
		options: {
			method,
			path: [
				'users',
				'abc',
				'boards',
				'abc',
				'videos',
				'abc'
			].join('/')
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

test('Not found request (user)', async () => {
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
				'boards',
				board,
				'videos',
				video,
			].join('/')
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
