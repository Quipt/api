import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import BoardFixture from '../../../../../../test/fixtures/board';
import {deleteRequest} from '../../../../../../test/_helpers';
import BoardDelete from '../../../../lib/board/delete';
import errors from '../../../../lib/favorite/errors';

const dynamodb = new DynamoDB();
const TableName = tables.board;
const keys = [];

test('BoardDelete - should delete a board', async () => {
	const {
		Key,
		Item,
		owner: user,
		id: board,
	} = new BoardFixture();

	keys.push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	await BoardDelete({
		user,
		board,
	}, tables);
});

test('BoardDelete - should not delete a board (invalid request)', async () => {
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

		const event = Object.assign({...validEvent}, {
			[key]: ''
		});

		try {
			await BoardDelete(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('BoardDelete - should not delete a board (not found request)', async () => {
	const {
		owner: user,
		id: board,
	} = new BoardFixture();

	let error;

	try {
		await BoardDelete({
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
