import assert from 'assert';
import test from 'ava';
import {request} from '../../_helpers';

const method = 'HEAD';

test('Invalid method request', async () => {
	const {
		statusCode,
	} = await request({
		options: {
			method,
			path: [
				'videos',
			].join('/'),
		},
	});

	assert.strictEqual(statusCode, 405, 'Incorrect HTTP status code');
});