import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import BoardFixture from '../../../../../../test/fixtures/board';
import FavoriteFixture from '../../../../../../test/fixtures/favorite';
import FavoriteCreate from '../../../../lib/favorite/create';
import errors from '../../../../lib/favorite/errors';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.favorite;
const deleteKeys = {
	[tables.board]: [],
	[tables.favorite]: [],
};

test('FavoriteCreate - should create a new favorite', async () => {
	const {
		Key: boardKey,
		Item: boardItem,
		owner,
		id: board,
	} = new BoardFixture();

	const {
		Key,
		Item, 
		user,
		created,
	} = new FavoriteFixture({ owner, board });

	deleteKeys[tables.board].push(boardKey);

	await dynamodb
		.putItem({
			TableName: tables.board,
			Item: boardItem,
		})
		.promise();

	deleteKeys[tables.favorite].push(Key);

	const result = await FavoriteCreate({
		user,
		owner,
		board,
		DEBUG_TIME: created
	}, tables);

	assert.deepStrictEqual(
		result,
		{
			Attributes: {
				created
			}
		}
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

test('FavoriteCreate - should not create a new favorite (invalid request)', async () => {
	const {
		Key,
		user,
		owner,
		board,
	} = new FavoriteFixture();

	deleteKeys[tables.favorite].push(Key);

	const validEvent = {
		user,
		owner,
		board,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({...validEvent}, {
			[key]: ''
		});

		try {
			await FavoriteCreate(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('FavoriteCreate - should not create a new favorite (not found)', async () => {
	const {
		Key, 
		user,
		owner,
		board,
	} = new FavoriteFixture();

	deleteKeys[tables.favorite].push(Key);

	let error;

	try {
		await FavoriteCreate({
			user,
			owner,
			board,
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.NOT_FOUND_BOARD);
});

test('FavoriteCreate - should not create a new favorite (conflict)', async () => {
	const {
		Key: boardKey,
		Item: boardItem,
		object: boardObject,
	} = new BoardFixture();

	const {
		owner,
		id: board
	} = boardObject;

	const {
		Key,
		Item,
		user,
	} = new FavoriteFixture({ owner, board });

	deleteKeys[tables.board].push(boardKey);

	await dynamodb
		.putItem({
			TableName: tables.board,
			Item: boardItem,
		})
		.promise();

	deleteKeys[tables.favorite].push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item
		})
		.promise();

	let error;

	try {
		await FavoriteCreate({
			user,
			owner,
			board,
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.CONFLICT);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: Object.entries(deleteKeys)
			.map(([TableName, keys]) => ({ [TableName]: keys.map(deleteRequest) }))
			.reduce((acc, val) => Object.assign(acc, val), {})
	})
	.promise()
);
