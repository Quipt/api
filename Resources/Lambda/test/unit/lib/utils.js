import assert from 'assert';
import test from 'ava';
import uuid from 'node-uuid';

import {base64SafeToBinary, binaryToBase64Safe} from '../../../lib/utils.js';

test('Binary to Base64 Safe', () => {
	assert.strictEqual(
		typeof binaryToBase64Safe,
		'function',
		'Type is not a function'
	)

	const values = [
		'aaaabbbb-cccc-dddd-eeee-ffff00001111',
		'22223333-4444-5555-6666-777788889999',
		'fbffbffb-ffbf-fbff-bffb-ffbffbffbffb',
	];

	for (const value of values) {
		const result = binaryToBase64Safe(
			uuid.parse(value, Buffer.alloc(16))
		);

		assert.strictEqual(typeof result, 'string', 'Type of result is not a string');
		assert.strictEqual(result.length, 22, 'Length of result is not 22');
		assert.ok(/^[0-9a-z_-]{22}$/i.test(result), 'Result did not match the regular expression');
	}
});

test('Base64 Safe to Binary', () => {
	assert.strictEqual(
		typeof base64SafeToBinary,
		'function',
		'Type is not a function'
	);

	const values = [
		'qqq7u8zM3d3u7v__AAAREQ',
		'IiIzM0REVVVmZnd3iIiZmQ',
		'-_-_-_-_-_-_-_-_-_-_-w'
	];

	for (const value of values) {
		const result = base64SafeToBinary(value);
		assert.ok(Buffer.isBuffer(result), 'Type of result is not a buffer');
		assert.strictEqual(result.length, 16, 'Length of result is not 16');
	}
});
