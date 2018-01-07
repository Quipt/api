import assert from 'assert';
import test from 'ava';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import {tables} from '../../../_config';
import {putRequest, deleteRequest} from '../../../../../../test/_helpers';
import HashFixture from '../../../../../../test/fixtures/hash';
import TokensCreate from '../../../../lib/tokens/create';
import errors from '../../../../lib/tokens/errors';

const dynamodb = new DynamoDB();
const TableName = tables.hash;
const keys = [];

test('TokensCreate - should create new tokens', async () => {
	const AWS_ACCESS_KEY_ID = 'AKIDEXAMPLE';
	const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
	const AWS_SESSION_TOKEN = 'sessiontokenexample';
	const S3_REGION = 'us-east-1';
	const bucket = 'test-bucket';
	const id = 'A'.repeat(22);

	const hashFixtures = new Array(3)
		.fill()
		.map((_, i) => new HashFixture({
			hash: i.toString().repeat(64),
			id,
			uploadPending: i === 0 ? true : undefined,
		}));

	const files = [
		{
			name: 'Test video one.mp4',
			size: 222352,
			index: 4,
		},
		{
			name: 'Test video two.mp4',
			size: 126961,
			index: 5,
		},
		{
			name: 'Test video three.mp4',
			size: 10e3,
			index: 6,
		},
	].map((item, i) => ({
		...item,
		hash: hashFixtures[i].hash,
		type: 'video/mp4',
	}));

	const DEBUG_TIME = 1483246800000;
	const DEBUG_UUID_OPTS = {
		node: [ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab ],
		clockseq: 0x1234,
		msecs: DEBUG_TIME,
		nsecs: 5678,
	};

	const expected = {
		AWS_ACCESS_KEY_ID,
		AWS_SESSION_TOKEN,
		S3_REGION,
		date: '20170101',
		tokens: [
			{
				filename: '00000000-0000-0000-0000-000000000000.mp4',
				policy_b64: 'eyJleHBpcmF0aW9uIjoiMjAxNy0wMS0wMVQwNToxNTowMC4wMDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0IjoidGVzdC1idWNrZXQifSx7ImtleSI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMC5tcDQifSx7ImFjbCI6InByaXZhdGUifSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsInZpZGVvLyJdLFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDIyMjM1MiwyMjIzNTJdLHsieC1hbXotY29udGVudC1zaGEyNTYiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIn0seyJ4LWFtei1jcmVkZW50aWFsIjoiQUtJREVYQU1QTEUvMjAxNzAxMDEvdXMtZWFzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsieC1hbXotc2VjdXJpdHktdG9rZW4iOiJzZXNzaW9udG9rZW5leGFtcGxlIn0seyJ4LWFtei1hbGdvcml0aG0iOiJBV1M0LUhNQUMtU0hBMjU2In0seyJ4LWFtei1kYXRlIjoiMjAxNzAxMDFUMDAwMDAwWiJ9XX0=',
				signature: '9319c7fde585022be1a8fbc9e7d65f5a3d82c0491e640d3d7ca886a6f28f9c85',
				hash: hashFixtures[0].hash,
				index: files[0].index,
			},
			{
				filename: '25c99e2e-cfdf-11e6-9234-0123456789ab.mp4',
				policy_b64: 'eyJleHBpcmF0aW9uIjoiMjAxNy0wMS0wMVQwNToxNTowMC4wMDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0IjoidGVzdC1idWNrZXQifSx7ImtleSI6IjI1Yzk5ZTJlLWNmZGYtMTFlNi05MjM0LTAxMjM0NTY3ODlhYi5tcDQifSx7ImFjbCI6InByaXZhdGUifSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsInZpZGVvLyJdLFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDEwMDAwLDEwMDAwXSx7IngtYW16LWNvbnRlbnQtc2hhMjU2IjoiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMiJ9LHsieC1hbXotY3JlZGVudGlhbCI6IkFLSURFWEFNUExFLzIwMTcwMTAxL3VzLWVhc3QtMS9zMy9hd3M0X3JlcXVlc3QifSx7IngtYW16LXNlY3VyaXR5LXRva2VuIjoic2Vzc2lvbnRva2VuZXhhbXBsZSJ9LHsieC1hbXotYWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LHsieC1hbXotZGF0ZSI6IjIwMTcwMTAxVDAwMDAwMFoifV19',
				signature: '60474e458b2aa362fd34b4c8cf5fab6a699cd0b779b581e49659ef607bb19ce2',
				hash: hashFixtures[2].hash,
				index: files[2].index,
			},
		],
		duplicates: [
			{
				id: '00000000-0000-0000-0000-000000000000',
				hash: hashFixtures[1].hash,
				index: files[1].index,
			},
		],
	};

	keys.push(...hashFixtures.map(({Key}) => Key));

	await dynamodb
		.batchWriteItem({
			RequestItems: {
				[TableName]: hashFixtures
					.slice(0, -1)
					.map(({Item}) => putRequest(Item)),
			},
		})
		.promise();

	const result = await TokensCreate({
		bucket,
		files,
		credentials: {
			AWS_ACCESS_KEY_ID,
			AWS_SESSION_TOKEN,
			AWS_SECRET_ACCESS_KEY,
			S3_REGION,
		},
		DEBUG_TIME,
		DEBUG_UUID_OPTS,
	}, tables);

	assert.deepStrictEqual(result, expected);
});

test('TokensCreate - should not create a new hash (invalid request)', async () => {
	const validEvent = {
		files: [],
	};

	for (const key of Object.keys(validEvent)) {
		let error;

		const event = Object.assign({ ...validEvent }, { [key]: '' });

		try {
			await TokensCreate(event, tables);
		} catch (err) {
			error = err;
		}

		assert.strictEqual(error, errors.INVALID);
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
