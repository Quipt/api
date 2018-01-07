import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import {putRequest, deleteRequest} from '../../../../../../test/_helpers';
import BoardFixture from '../../../../../../test/fixtures/board';
import HashFixture from '../../../../../../test/fixtures/hash';
import VideoFixture from '../../../../../../test/fixtures/video';
import VideoCreate from '../../../../lib/video/create';
import errors from '../../../../lib/video/errors';

const dynamodb = new DynamoDB();

const TableName = tables.video;
const deleteKeys = {
	[tables.board]: [],
	[tables.hash]: [],
	[tables.video]: [],
};

test('VideoCreate - should create a new video', async () => {
	const {
		Key: boardKey,
		Item: boardItem,
		owner,
		id: board,
	} = new BoardFixture();

	const {
		Key: hashKey,
		Item: hashItem,
		id,
	} = new HashFixture();

	const {
		Key,
		Item,
		id: video,
		caption,
		created,
	} = new VideoFixture({owner, board, id});

	deleteKeys[tables.board].push(boardKey);
	deleteKeys[tables.hash].push(hashKey);

	await dynamodb
		.batchWriteItem({
			RequestItems: {
				[tables.board]: [ boardItem ].map(putRequest),
				[tables.hash]: [ hashItem ].map(putRequest),
			},
		})
		.promise();

	deleteKeys[tables.video].push(Key);

	const result = await VideoCreate({
		user: owner,
		board,
		video,
		caption,
		DEBUG_TIME: created
	}, tables);

	assert.deepStrictEqual(
		result,
		{
			Attributes: {
				created,
			},
		},
	);

	const data = await dynamodb
		.getItem({
			TableName,
			Key,
		})
		.promise();

	delete data.Item.ttl;
	delete Item.ttl;
	assert.deepStrictEqual(data.Item, Item);
});

test('VideoCreate - should not create a new video (invalid request)', async () => {
	const {
		Key,
		owner: user,
		board,
		video,
		caption,
	} = new VideoFixture();

	deleteKeys[tables.video].push(Key);

	const validEvent = {
		user,
		board,
		video,
		caption,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent} , {
			[key]: ''
		});

		try {
			await VideoCreate(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('VideoCreate - should not create a new video (not found--board)', async () => {
	const {
		owner,
		id: board,
	} = new BoardFixture();

	const {
		Key: hashKey,
		Item: hashItem,
		id,
	} = new HashFixture();

	const {
		Key,
		owner: user,
		id: video,
		caption,
	} = new VideoFixture({ owner, board, id });

	deleteKeys[tables.hash].push(hashKey);

	await dynamodb
		.putItem({
			TableName: tables.hash,
			Item: hashItem,
		})
		.promise();

	deleteKeys[tables.video].push(Key);

	let error;

	try {
		await VideoCreate({
			user,
			board,
			video,
			caption
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.NOT_FOUND_BOARD);
});

test('VideoCreate - should not create a new video (not found--video)', async () => {
	const {
		Key: boardKey,
		Item: boardItem,
		owner,
		id: board,
	} = new BoardFixture();

	const {
		object: hashObject,
		id,
	} = new HashFixture();

	const {
		Key,
		owner: user,
		id: video,
		caption,
	} = new VideoFixture({owner, board, id});

	deleteKeys[tables.board].push(boardKey);

	await dynamodb
		.putItem({
			TableName: tables.board,
			Item: boardItem,
		})
		.promise();

	deleteKeys[tables.video].push(Key);

	let error;

	try {
		await VideoCreate({
			user,
			board,
			video,
			caption
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.NOT_FOUND_VIDEO);
});

test('VideoCreate - should not create a new video (conflict)', async () => {
	const {
		Key: boardKey,
		Item: boardItem,
		owner,
		id: board,
	} = new BoardFixture();

	const {
		Key: hashKey,
		Item: hashItem,
		id,
	} = new HashFixture();

	const {
		Key,
		Item,
		owner: user,
		id: video,
		caption,
	} = new VideoFixture({owner, board, id});

	deleteKeys[tables.board].push(boardKey);
	deleteKeys[tables.hash].push(hashKey);
	deleteKeys[tables.video].push(Key);

	await dynamodb
		.batchWriteItem({
			RequestItems: {
				[tables.board]: [ boardItem ].map(putRequest),
				[tables.hash]: [ hashItem ].map(putRequest),
				[tables.video]: [ Item ].map(putRequest),
			},
		})
		.promise();

	let error;

	try {
		await VideoCreate({
			user,
			board,
			video,
			caption
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.CONFLICT);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: Object.entries(deleteKeys)
			.filter(([TableName, keys]) => keys.length)
			.map(([TableName, keys]) => ({ [TableName]: keys.map(deleteRequest), }))
			.reduce((acc, val) => Object.assign(acc, val), {})
	})
	.promise()
);
