import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import UserFixture from '../../../../../../test/fixtures/user.js';
import UserCreate from '../../../../lib/user/create';
import errors from '../../../../lib/user/errors';
import { deleteRequest } from '../../../../../../test/_helpers';

const dynamodb = new DynamoDB();
const TableName = tables.user;
const keys = [];

test('UserCreate - should create a new user', async () => {
	const {
		Key,
		Item,
		id: user,
		username,
		displayname,
		email,
		subscribe,
		created,
	} = new UserFixture();

	keys.push(Key);

	const result = await UserCreate(
		{
			user,
			username,
			displayname,
			email,
			subscribe,
			DEBUG_TIME: created
		},
		tables
	);

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

test('UserCreate - should not create a new user (username conflict)', async () => {
	const {
		Key: existingUserKey,
		Item,
		username,
	} = new UserFixture();

	const {
		Key,
		id: user,
		displayname,
		email,
		subscribe,
	} = new UserFixture({ username });

	keys.push(existingUserKey, Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	try {
		await UserCreate(
			{
				user,
				username,
				displayname,
				email,
				subscribe,
			},
			tables
		);
	} catch (error) {
		assert.strictEqual(error, errors.USERNAME_TAKEN);
	}
});

test('UserCreate - should not create a new user (id conflict)', async () => {
	const {
		Item,
		id,
	} = new UserFixture();

	const {
		Key,
		id: user,
		username,
		displayname,
		email,
		subscribe,
	} = new UserFixture({ id });

	// Key is the id, no need to pass in existing user Key
	keys.push(Key);

	await dynamodb
		.putItem({
			TableName,
			Item,
		})
		.promise();

	try {
		await UserCreate(
			{
				user,
				username,
				displayname,
				email,
				subscribe,
			},
			tables
		);
	} catch (error) {
		assert.strictEqual(error, errors.CONFLICT);
	}
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[TableName]: keys.map(deleteRequest),
		},
	})
	.promise()
);
