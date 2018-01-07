import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import VideoFixture from '../../../../../../test/fixtures/video';
import VideoUpdate from '../../../../lib/video/update';
import errors from '../../../../lib/video/errors';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.video;
const keys = [];

test('VideoUpdate - should update a video', async () => {
	const {
		Key,
		Item, 
		owner: user,
		board,
		id: video,
	} = new VideoFixture();
	const caption = 'TEST';
	const modified = Date.now();

	keys.push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	const result = await VideoUpdate({
		user,
		board,
		video,
		caption,
		DEBUG_TIME: modified
	}, tables);

	assert.deepStrictEqual(
		result,
		{
			Attributes: {
				modified,
			},
		},
	);

	const data = await dynamodb
		.getItem({
			TableName,
			Key,
		})
		.promise();

	const updatedItem = Object.assign({...Item}, {
		caption: {
			S: caption
		},
		modified: {
			N: modified.toString()
		},
	});

	assert.deepStrictEqual(data.Item, updatedItem);
});

test('VideoUpdate - should not create a new video (invalid request)', async () => {
	const {
		owner: user,
		board,
		id: video,
		caption,
	} = new VideoFixture();

	const validEvent = {
		user,
		board,
		video,
		caption,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent }, { [key]: '' });

		try {
			await VideoUpdate(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('VideoUpdate - should not update a video (not found request)', async () => {
	const {
		owner: user,
		board,
		id: video,
	} = new VideoFixture();
	const caption = 'TEST';

	let error;

	try {
		await VideoUpdate({
			user,
			board,
			video,
			caption,
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
		},
	})
	.promise()
);
