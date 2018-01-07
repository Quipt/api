import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import BoardUpdate from '../../../../lib/board/update';
import errors from '../../../../lib/board/errors';
import BoardFixture from '../../../../../../test/fixtures/board';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.board;
const keys = [];

test('BoardUpdate - should update a board', async () => {
	const {
		Key,
		Item, 
		owner: user,
		id: board,
	} = new BoardFixture();

	const name = 'TEST';
	const modified = Date.now();

	keys.push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	const result = await BoardUpdate({
		user,
		board,
		name,
		DEBUG_TIME: modified
	}, tables);

	assert.deepStrictEqual(
		result,
		{
			Attributes: {
				modified,
			},
		}
	);

	const data = await dynamodb
		.getItem({
			TableName,
			Key,
		})
		.promise();

	const updatedItem = Object.assign({...Item}, {
		name: {
			S: name
		},
		modified: {
			N: modified.toString()
		},
	});

	assert.deepStrictEqual(data.Item, updatedItem);
});

test('BoardUpdate - should not create a new board (invalid request)', async () => {
	const {
		owner: user,
		id: board,
		name
	} = new BoardFixture();

	const validEvent = {
		user,
		board,
		name,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({...validEvent}, {
			[key]: ''
		});

		try {
			await BoardUpdate(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('BoardUpdate - should not update a board (not found request)', async () => {
	const {
		owner: user,
		id: board,
	} = new BoardFixture();
	const name = 'TEST';

	let error;

	try {
		await BoardUpdate({
			user,
			board,
			name,
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
