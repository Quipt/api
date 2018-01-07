import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import FavoriteFixture from '../../../../../../test/fixtures/favorite';
import FavoriteDelete from '../../../../lib/favorite/delete';
import errors from '../../../../lib/favorite/errors';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.favorite;
const keys = [];

test('FavoriteDelete - should delete a favorite', async () => {
	const {
		Key,
		Item, 
		user,
		owner,
		board,
	} = new FavoriteFixture();

	keys.push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	await FavoriteDelete({
		user,
		owner,
		board,
	}, tables);
});

test('FavoriteDelete - should not delete a favorite (invalid request)', async () => {
	const {
		user,
		owner,
		board,
	} = new FavoriteFixture();

	const validEvent = {
		user,
		owner,
		board,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent }, { [key]: '' });

		try {
			await FavoriteDelete(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('FavoriteDelete - should not delete a favorite (not found request)', async () => {
	const {
		user,
		owner,
		board,
	} = new FavoriteFixture();

	let error;

	try {
		await FavoriteDelete({
			user,
			owner,
			board,
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.NOT_FOUND_FAVORITE);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[TableName]: keys.map(deleteRequest),
		},
	})
	.promise()
);
