import uuid from 'node-uuid';
import sigv4 from 'aws-sigv4';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();
const batchWriteLimit = 25;

function getPolicyJSONbase64(bucket, expiration, key, hash, size, credential, AWS_SESSION_TOKEN, date) {
	return Buffer.from(
		JSON.stringify({
			expiration,
			conditions: [
				{bucket},
				{key},
				{acl: 'private'},
				['starts-with', '$Content-Type', 'video/'],
				['content-length-range', size, size],
				{'x-amz-content-sha256': hash},
				{'x-amz-credential': credential},
				{'x-amz-security-token': AWS_SESSION_TOKEN},
				{'x-amz-algorithm': 'AWS4-HMAC-SHA256'},
				{'x-amz-date': date},
			],
		})
	)
		.toString('base64');
}

function chunk(array, size) {
	return new Array(Math.ceil(array.length / size))
		.fill()
		.map((item, i) => array.slice(i * size, size));
}

export default async function(event, tables) {
	const {
		bucket,
		files,
		credentials = { ...process.env },
		DEBUG_TIME,
		DEBUG_UUID_OPTS = null,
	} = event;

	const {
		AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY,
		AWS_SESSION_TOKEN,
		S3_REGION,
	} = credentials;

	if (!files) {
		return Promise.reject(errors.INVALID);
	}

	const now = DEBUG_TIME || Date.now();
	const hashTable = tables.hash;
	const duplicates = [];
	const tableWrites = [];
	const expiration = new Date(now + 15 * 60000).toISOString(); // 15 minutes from now
	const dtg = sigv4.formatDateTime(new Date(now));
	const date = dtg.slice(0, 8);
	const hashMap = new Map();

	const {Responses} = await dynamodb
		.batchGetItem({
			RequestItems: {
				[hashTable]: {
					Keys: files.map(({hash}, i) => {
						hashMap.set(hash, i);

						return {
							hash: {
								B: Buffer.from(hash, 'hex')
							}
						}
					})
				}
			}
		})
		.promise();

	const items = Responses[hashTable];

	for (const item of items) {
		const hash = item.hash.B.toString('hex');
		const fileIndex = hashMap.get(hash);
		const file = files[fileIndex];

		// Check if the hash has been requested but the upload was not complete
		if ('uploadPending' in item) {
			file.id = item.id.B;
			continue;
		}

		// If the hash exists and the upload is complete, the file is a duplicate
		duplicates.push({
			id: uuid.unparse(item.id.B),
			hash,
			index: file.index || 0
		});

		delete files[fileIndex];
	}

	const promises = files
		.filter(file => file)
		.map(async file => {
			const id = file.id || uuid.v1(DEBUG_UUID_OPTS, Buffer.alloc(16));

			// new file, need to write it to the database
			if (!file.id) {
				tableWrites.push({
					PutRequest: {
						Item: {
							id: {
								B: id
							},
							hash: {
								B: Buffer.from(file.hash, 'hex')
							},
							uploadPending: {
								NULL: true
							},
							created: {
								N: now.toString()
							}
						}
					}
				});
			}

			const filename = `${uuid.unparse(id)}.mp4`;

			const policy_b64 = getPolicyJSONbase64(
				bucket,
				expiration,
				filename,
				file.hash,
				file.size,
				`${AWS_ACCESS_KEY_ID}/${date}/${S3_REGION}/s3/aws4_request`,
				AWS_SESSION_TOKEN,
				`${date}T000000Z`
			);

			const signature = await sigv4.sign(
				AWS_SECRET_ACCESS_KEY,
				date,
				S3_REGION,
				's3',
				policy_b64
			);

			return {
				filename,
				policy_b64,
				signature,
				hash: file.hash,
				index: file.index || 0
			};
		});

	const tokens = await Promise.all(promises);

	await Promise.all(
		chunk(tableWrites, batchWriteLimit)
			.map(tableWritesChunk => dynamodb
				.batchWriteItem({
					RequestItems: {
						[hashTable]: tableWritesChunk
					}
				})
				.promise()
			)
	);

	return {
		AWS_ACCESS_KEY_ID,
		AWS_SESSION_TOKEN,
		S3_REGION,
		date,
		tokens,
		duplicates
	};
}
