import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {boardTable, favoriteTable} from '../../../../../../_config';
import {SubjectFromWebIdentityToken as user} from '../../../../../../credentials.json';
import {sigv4Request as request, deleteRequest, putRequest} from '../../../../../../_helpers';
import {cognitoId, uuidBase64Safe} from '../../../../../../fixtures/fakes';
import BoardFixture from '../../../../../../fixtures/board';
import FavoriteFixture from '../../../../../../fixtures/favorite';

const dynamodb = new DynamoDB();
const method = 'PUT';

const owner = user;

const board = new BoardFixture({ owner });
const favorite = new FavoriteFixture({ user, owner, board: board.id });

const conflictBoard = new BoardFixture();
const conflictFavorite = new FavoriteFixture({
	user,
	owner: conflictBoard.owner,
	board: conflictBoard.id
});

test.before(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[boardTable]: [
				board.Item,
				conflictBoard.Item,
			].map(putRequest),
			[favoriteTable]: [
				conflictFavorite.Item,
			].map(putRequest),
		},
	})
	.promise()
);

test('Well-formed request', async () => {
	const {
		statusCode,
		headers,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
				'favorites',
				encodeURIComponent(favorite.owner),
				favorite.board,
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 201, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.ok(body.created);
});

test('Invalid request', async () => {
	const {
		statusCode,
		headers,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
				'favorites',
				encodeURIComponent(board.owner),
				'abc',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Invalid request',
		},
	);
});

test('Not found request', async () => {
	const {
		statusCode,
		headers,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
				'favorites',
				encodeURIComponent(cognitoId()),
				uuidBase64Safe(),
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 404, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Board not found',
		},
	);
});

test('Conflict request', async () => {
	const {
		statusCode,
		headers,
		body,
	} = await request({
		options: {
			method,
			path: [
				'users',
				encodeURIComponent(user),
				'favorites',
				encodeURIComponent(conflictFavorite.owner),
				conflictFavorite.board,
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 409, 'Incorrect HTTP status code');
	assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
	assert.deepStrictEqual(
		body,
		{
			message: 'Favorite already exists',
		},
	);
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[boardTable]: [
				board.Key,
				conflictBoard.Key,
			].map(deleteRequest),
			[favoriteTable]: [
				favorite.Key,
				conflictFavorite.Key,
			].map(deleteRequest),
		},
	})
	.promise()
);
