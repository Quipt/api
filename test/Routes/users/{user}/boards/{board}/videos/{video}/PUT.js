import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import credentials from '../../../../../../../credentials.json';
import {boardTable, hashTable, videoTable} from '../../../../../../../_config';
import {sigv4Request as request, putRequest, deleteRequest} from '../../../../../../../_helpers';
import {uuidBase64Safe} from '../../../../../../../fixtures/fakes';

import BoardFixture from '../../../../../../../fixtures/board';
import HashFixture from '../../../../../../../fixtures/hash';
import VideoFixture from '../../../../../../../fixtures/video';

const user = credentials.SubjectFromWebIdentityToken;
const dynamodb = new DynamoDB();
const method = 'PUT';
const now = Date.now();

const {
	Item: boardItem,
	Key: boardKey,
	id: board,
} = new BoardFixture({ owner: user });

const {
	Item: hashItem,
	Key: hashKey,
	id: video,
} = new HashFixture({ owner: user });

const {
	Item: videoItem,
	Key: videoKey,
	caption,
} = new VideoFixture({
	owner: user,
	id: video,
	board,
});

const conflictHash = new HashFixture({ owner: user });

const conflictVideo = new VideoFixture({
	owner: user,
	board,
	id: conflictHash.id,
});

test.before(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			// Create a board
			[boardTable]: [
				boardItem,
			].map(putRequest),
			// Create the hash
			[hashTable]: [
				hashItem,
				conflictHash.Item,
			].map(putRequest),
			// Create the conflict video
			[videoTable]: [
				conflictVideo.Item,
			].map(putRequest)
		}
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
				video,
			].join('/')
		},
		body: {
			caption,
		},
	});

	assert.strictEqual(statusCode, 201, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(typeof body, 'object', 'body missing');
	assert.strictEqual(typeof body.created, 'number');
	assert.ok(body.created > now);
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
				'abc',
			].join('/')
		},
		body: {
			caption,
		},
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
		body,
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
				uuidBase64Safe(),
			].join('/')
		},
		body: {
			caption,
		}
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Video not found',
		}
	);
});

test('Conflict request', async () => {
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
				conflictVideo.id,
			].join('/')
		},
		body: {
			caption: conflictVideo.caption,
		}
	});

	assert.strictEqual(statusCode, 409, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Video already exists on this board',
		}
	);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[boardTable]: [
				boardKey,
			].map(deleteRequest),
			[hashTable]: [
				hashKey,
				conflictHash.Key,
			].map(deleteRequest),
			[videoTable]: [
				videoKey,
				conflictVideo.Key,
			].map(deleteRequest)
		}
	})
	.promise()
);
