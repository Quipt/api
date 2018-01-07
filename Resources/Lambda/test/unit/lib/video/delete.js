import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import VideoFixture from '../../../../../../test/fixtures/video';
import VideoDelete from '../../../../lib/video/delete';
import errors from '../../../../lib/video/errors';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.video;
const keys = [];

test('VideoDelete - should delete a video', async () => {
	const {
		Key,
		Item,
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

	await VideoDelete({
		user,
		board,
		video,
	}, tables);
});

test('VideoDelete - should not delete a video (invalid request)', async () => {
	const {
		owner: user,
		board,
		id: video,
	} = new VideoFixture();

	const validEvent = {
		user,
		board,
		video,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent }, { [key]: '' });

		try {
			await VideoDelete(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('VideoDelete - should not delete a video (not found request)', async () => {
	const {
		owner: user,
		board,
		id: video,
	} = new VideoFixture();

	let error;

	try {
		await VideoDelete({
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
			[TableName]: keys.map(deleteRequest),
		}
	})
	.promise()
);
