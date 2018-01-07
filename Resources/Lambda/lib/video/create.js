import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {
		user,
		board,
		video,
		caption,
		DEBUG_TIME,
	} = event;

	if (!(user && board && video && caption))
		return Promise.reject(errors.INVALID);

	const now = DEBUG_TIME || Date.now();
	const nowObject = {
		N: now.toString()
	};

	const boardId = {
		B: Buffer.from(board, 'base64')
	};
	const videoId = Buffer.from(video, 'base64');
	const owner = {
		S: user
	};

	try {
		await Promise.all([
			(async () => {
				// Check if the item exists in the board table
				const {Count} = await dynamodb
					.query({
						TableName: tables.board,
						ExpressionAttributeNames: {
							'#0': 'owner',
							'#1': 'id',
						},
						ExpressionAttributeValues: {
							':0': owner,
							':1': boardId,
						},
						KeyConditionExpression: '#0 = :0 AND #1 = :1',
						Select: 'COUNT'
					})
					.promise();

				if (!Count)
					return Promise.reject(errors.NOT_FOUND_BOARD);
			})(),
			(async () => {
				// Check if the video exists in the hash table
				const {Count} = await dynamodb
					.query({
						TableName: tables.hash,
						IndexName: 'id-hash-index',
						ExpressionAttributeNames: {
							'#0': 'id',
							// '#1': 'uploadPending'
						},
						ExpressionAttributeValues: {
							':0': {
								B: videoId
							}
						},
						KeyConditionExpression: '#0 = :0',
						// FilterExpression: 'attribute_not_exists(#1)',
						Select: 'COUNT'
					})
					.promise();

				if (!Count)
					return Promise.reject(errors.NOT_FOUND_VIDEO);
			})()
		]);
	} catch (error) {
		return Promise.reject(error);
	}

	try {
		await dynamodb
			.putItem({
				TableName: tables.video,
				Item: {
					board: boardId,
					id: {
						B: videoId
					},
					owner,
					created: nowObject,
					modified: nowObject,
					caption: {
						S: caption
					}
				},
				ExpressionAttributeNames: {
					'#0': 'id'
				},
				ConditionExpression: 'attribute_not_exists(#0)'
			})
			.promise();

		return {
			Attributes: {
				created: now
			}
		};
	} catch (error) {
		return Promise.reject(errors.CONFLICT);
	}
}
