import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import BoardFixture from '../../../../../../test/fixtures/board';
import {deleteRequest} from '../../../../../../test/_helpers';
import BoardCreate from '../../../../lib/board/create';
import errors from '../../../../lib/board/errors';
import {base64SafeToBinary} from '../../../../lib/utils';

const dynamodb = new DynamoDB();
const TableName = tables.board;
const keys = [];

test('BoardCreate - should create a new board', async () => {
	const {
		Key,
		Item,
		owner: user,
		id,
		name,
		created,
	} = new BoardFixture();

	keys.push(Key);

	const result = await BoardCreate({
		user,
		name,
		DEBUG_ID: base64SafeToBinary(id),
		DEBUG_TIME: created
	}, tables);

	assert.deepStrictEqual(
		result,
		{
			Location: id,
			Attributes: {
				created,
			},
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

test('BoardCreate - should not create a new board (invalid request)', async () => {
	const {
		Key,
		owner: user,
		name,
	} = new BoardFixture();

	keys.push(Key);

	const validEvent = {
		user,
		name,
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent }, {
			[key]: '',
		});

		try {
			await BoardCreate(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
	}
});

test('BoardCreate - should not create a new board (conflict)', async () => {
	const {
		Key,
		Item,
		owner: user,
		id,
		name,
	} = new BoardFixture();

	keys.push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	let error;

	try {
		await BoardCreate({
			user,
			name,
			DEBUG_ID: base64SafeToBinary(id),
		}, tables);
	} catch (err) {
		error = err;
	}

	assert.strictEqual(error, errors.CONFLICT);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[TableName]: keys.map(deleteRequest),
		},
	})
	.promise()
);
