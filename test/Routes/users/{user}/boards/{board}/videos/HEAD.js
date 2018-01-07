import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {videoTable} from '../../../../../../_config';
import {toBase64Safe, request, putRequest, deleteRequest} from '../../../../../../_helpers';
import BoardFixture from '../../../../../../fixtures/board';
import VideoFixture from '../../../../../../fixtures/video';

const dynamodb = new DynamoDB();
const method = 'HEAD';

const {
	owner: user,
	id: board,
} = new BoardFixture();

const videos = new Array(3)
	.fill()
	.map(() => new VideoFixture({
		owner: user,
		board,
	}));

test.before(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[videoTable]: videos
				.map(({Item}) => Item)
				.map(putRequest)
		}
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
			].join('/')
		}
	});

	assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.ok(headers['access-control-expose-headers']);
	assert.ok(headers['x-total']);
	assert.strictEqual(body, null, 'Body is not empty');
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
				'abcdef',
				'boards',
				'abcdef',
				'videos',
			].join('/')
		}
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.strictEqual(body, null, 'Body is not empty');
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[videoTable]: videos
				.map(({Key}) => Key)
				.map(deleteRequest)
		}
	})
	.promise()
);
