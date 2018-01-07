import assert from 'assert';
import sigv4 from 'aws-sigv4';
import https from 'https';
import * as config from './_config';
import {Credentials as creds} from './credentials.json';
import test from 'ava';

/**
 * HTTPS Request
 *
 * @param params {object}
 * @param params.options {object}
 * @param params.options.headers {object}
 * @param params.body {string}
 * @returns {Promise}
 */
function promiseHttpRequest(params) {
	return new Promise((resolve, reject) => {
		const req = https
			.request(params.options, res => {
				let data = '';

				res.setEncoding('utf8');
				res.on('data', d => data += d);
				res.on('end', () => {
					let body = null;

					try {
						body = JSON.parse(data || null);
					} catch (error) {
						console.error(error);
					}

					return resolve({
						statusCode: res.statusCode,
						headers: res.headers,
						body
					});
				});
			})
			.on('error', reject);

		if (params.body)
			req.write(params.body);

		req.end()
	});
}

export function request(params) {
	const _params = {...params};

	_params.options = Object.assign({ ...params.options }, {
		hostname: config.hostname,
		port: 443,
		path: `/${config.stage}/${params.options.path}`,
	});

	if (params.body) {
		_params.body = JSON.stringify(params.body);

		_params.options.headers = {
			'Content-Type': 'application/json',
			'Content-Length': params.body.length
		};
	}

	return promiseHttpRequest(_params)
}

const credentials = {
	accessKeyId: creds.AccessKeyId,
	secretAccessKey: creds.SecretAccessKey,
	sessionToken: creds.SessionToken,
};
const date = new Date();
const requestDate = sigv4.formatDateTime(date);

const service = 'execute-api';

const signingKey = sigv4.preCalculateSigningKey(
	credentials.secretAccessKey,
	requestDate.substr(0, 8),
	config.region,
	service,
);

export async function sigv4Request(params) {
	const options = params.options;

	options.hostname = config.hostname;
	options.path = `/${config.stage}/${options.path}`;

	const contentType = 'Content-Type';
	const httpRequestMethod = options.method || 'GET';
	const requestPayload = JSON.stringify(params.body);
	params.body = requestPayload;

	const host = options.hostname;
	const canonicalQueryString = '';
	const canonicalURI = encodeURI(options.path);

	const headers = {
		accept: 'application/json',
		host,
		'x-amz-date': requestDate
	};

	if (typeof options.headers === 'object')
		Object.assign(headers, options.headers);

	const credentialScope = [
		requestDate.substr(0, 8),
		config.region,
		service,
		'aws4_request'
	].join('/');

	const headersMap = new Map();

	for (const [key, value] of Object.entries(headers)) {
		const lowerKey = key.toLowerCase();

		if (headersMap.has(lowerKey))
			headersMap.get(lowerKey).push(value);
		else
			headersMap.set(lowerKey, [value]);
	}

	const sortedHeadersKeys = [...headersMap.keys()].sort();

	const canonicalHeaders = sortedHeadersKeys
		.map(key => `${key}:${headersMap.get(key).join()}`)
		.join('\n');

	const signedHeaders = sortedHeadersKeys.join(';');

	const canonicalRequest = await sigv4.buildCanonicalRequest(
		httpRequestMethod,
		canonicalURI,
		canonicalQueryString,
		canonicalHeaders,
		signedHeaders,
		requestPayload
	);
	const hashedCanonicalRequest = await sigv4.hash(canonicalRequest);

	const stringToSign = sigv4.buildStringToSign(
		requestDate,
		credentialScope,
		hashedCanonicalRequest
	);

	const signature = await sigv4.preCalculatedSign(
		await signingKey,
		stringToSign
	);

	headers['Authorization'] = sigv4.buildAuthorization(
		credentials.accessKeyId,
		credentialScope,
		signedHeaders,
		signature
	);

	if (!requestPayload)
		delete headers[contentType];

	if (credentials.sessionToken)
		headers['x-amz-security-token'] = credentials.sessionToken;

	options.headers = options.headers || {};
	Object.assign(options.headers, headers);

	return promiseHttpRequest(params)
}

/**
 * Base64 string to URL Safe
 *
 * @param {!string} value
 * @returns {string}
 */
export function toBase64Safe(value) {
	return value
		.replace(/=+$/, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

/**
 * Base64 string to URL Unsafe
 *
 * @param {!string} value
 * @param {boolean} pad
 * @returns {string}
 */
export function toBase64Unsafe(value, pad) {
	return value
		.replace(/-/g, '+')
		.replace(/_/g, '/') + pad ? '==' : '';
}

export function base64SafeToBinary(value) {
	return Buffer.from(
		value.replace(/[-_]/g, c => c === '-' ? '+' : '/') + '==',
		'base64'
	);
}

export function standardOptionsTest({allowMethods, path, method = 'OPTIONS', name = 'Well-formed request'}) {
	test(name, async () => {
		const {
			statusCode,
			headers,
			body
		} = await exports.request({
			options: {
				method,
				path: path.join('/')
			}
		});

		assert.strictEqual(statusCode, 200, 'Incorrect HTTP status code');
		assert.ok(headers['access-control-allow-headers'], 'Invalid Access-Control-Allow-Headers header');
		assert.ok(headers['access-control-allow-origin'], 'Invalid Access-Control-Allow-Origin header');
		assert.strictEqual(headers['access-control-allow-methods'], allowMethods.join(), 'Incorrect Access-Control-Allow-Methods header');
		assert.strictEqual(headers['content-length'], '0', 'Invalid Content-Length header');
		assert.strictEqual(body, null, 'Body is not empty');
	});
}

export function putRequest(Item) {
	return {
		PutRequest: {
			Item,
		},
	};
}

export function deleteRequest(Key) {
	return {
		DeleteRequest: {
			Key,
		},
	};
}