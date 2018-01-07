import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import VideoFixture from '../../../../../../test/fixtures/video';
import VideoRead from '../../../../lib/video/read';
import errors from '../../../../lib/video/errors';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.video;
const keys = [];

test('VideoRead - should read a video', async () => {
	const {
		Key,
		Item,
		Item: {
			created,
			modified,
			caption,
		},
		owner: user,
		board,
		id: video,
	} = new VideoFixture();

	keys.push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	const result = await VideoRead({
		user,
		board,
		video,
	}, tables);

	assert.deepStrictEqual(result, {
		Item: {
			created,
			modified,
			caption,
		}
	});
});

test('VideoRead - should not read a video (invalid request)', async () => {
	const {
		owner: user,
		board,
		id: video,
	} = new VideoFixture();

	const validEvent = {
		user,
		board,
		video
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent }, { [key]: '' });

		try {
			await VideoRead(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('VideoRead - should not read a video (not found request)', async () => {
	const {
		owner: user,
		board,
		id: video,
	} = new VideoFixture();

	let error;

	try {
		await VideoRead({
			user,
			board,
			video,
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.NOT_FOUND_VIDEO);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[TableName]: keys.map(deleteRequest)
		}
	})
	.promise()
);
