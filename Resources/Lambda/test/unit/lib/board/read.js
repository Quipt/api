import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import BoardFixture from '../../../../../../test/fixtures/board';
import BoardRead from '../../../../lib/board/read';
import errors from '../../../../lib/board/errors';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.board;
const keys = [];

test('BoardRead - should read a board', async () => {
	const {
		Key,
		Item, 
		owner: user,
		id: board,
	} = new BoardFixture();

	keys.push(Key);

	const {
		name,
		created,
		modified,
	} = Item;

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	const result = await BoardRead({
		user,
		board
	}, tables);

	assert.deepStrictEqual(result, {
		Item: {
			name,
			created,
			modified,
		},
	});
});

test('BoardRead - should not read a board (invalid request)', async () => {
	const {
		owner: user,
		id: board,
	} = new BoardFixture();

	const validEvent = {
		user,
		board,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent }, {
			[key]: ''
		});

		try {
			await BoardRead(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('BoardRead - should not read a board (not found request)', async () => {
	const {
		owner: user,
		id: board,
	} = new BoardFixture();

	let error;

	try {
		await BoardRead({
			user,
			board,
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.NOT_FOUND_BOARD);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[TableName]: keys.map(deleteRequest)
		}
	})
	.promise()
);
