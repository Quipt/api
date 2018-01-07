import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {hashTable} from '../../_config';
import {SubjectFromWebIdentityToken as user} from '../../credentials.json';
import {sigv4Request as request, putRequest, deleteRequest} from '../../_helpers';
import {words, intFromRange} from '../../fixtures/fakes';
import HashFixture from '../../fixtures/hash';

const dynamodb = new DynamoDB();
const method = 'POST';

// new
const hash1 = new HashFixture({ user });
// upload pending
const hash2 = new HashFixture({ user, uploadPending: true });
// duplicate
const hash3 = new HashFixture({ user });

test.before(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[hashTable]: [
				hash2,
				hash3,
			].map(({Item}) => putRequest(Item)),
		}
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
				'videos',
			].join('/'),
		},
		body: [
			hash1,
			hash2,
			hash3,
		].map(({hash}, index) => ({
			name: `${words(2, 5)}.mp4`,
			size: intFromRange(5 * 1024 ** 2, 20 * 1024 ** 2),
			type: 'video/mp4',
			hash,
			index,
		})),
	});

	assert.strictEqual(statusCode, 201, 'Incorrect HTTP status code');
	assert.strictEqual(typeof body, 'object', 'body missing');

	const {
		AWS_ACCESS_KEY_ID,
		AWS_SESSION_TOKEN,
		S3_REGION,
		date,
		tokens,
		duplicates,
	} = body;

	assert.strictEqual(typeof AWS_ACCESS_KEY_ID, 'string');
	assert.strictEqual(typeof AWS_SESSION_TOKEN, 'string');
	assert.strictEqual(typeof S3_REGION, 'string');
	assert.strictEqual(date, new Date().toISOString().replace(/-/g, '').slice(0, 8));
	assert.ok(Array.isArray(tokens));
	assert.strictEqual(tokens.length, 2);

	for (const { filename, policy_b64, signature, hash, index } of tokens) {
		assert.ok(filename);
		assert.ok(policy_b64);
		assert.ok(signature);
		assert.ok(hash);
		assert.strictEqual(typeof index, 'number');
	}

	assert.ok(Array.isArray(duplicates));
	assert.strictEqual(duplicates.length, 1);

	for (const { id, hash, index } of duplicates) {
		assert.ok(id);
		assert.ok(hash);
		assert.strictEqual(typeof index, 'number');
	}

	// TODO match the data to the response model
});

test('Invalid request (missing body)', async () => {
	const {
		statusCode,
		headers,
		body,
	} = await request({
		options: {
			method,
			path: [
				'videos',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 400, 'Incorrect HTTP status code');
});

test.after(() => dynamodb
	.batchWriteItem({
		RequestItems: {
			[hashTable]: [
				hash1,
				hash2,
				hash3,
			].map(({Key}) => deleteRequest(Key)),
		},
	})
);
