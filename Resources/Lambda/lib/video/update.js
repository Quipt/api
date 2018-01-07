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

	try {
		await dynamodb
			.updateItem({
				TableName: tables.video,
				Key: {
					board: {
						B: Buffer.from(board, 'base64')
					},
					id: {
						B: Buffer.from(video, 'base64')
					}
				},
				ExpressionAttributeNames: {
					'#0': 'id',
					'#1': 'owner',
					'#2': 'modified',
					'#3': 'caption'
				},
				ExpressionAttributeValues: {
					':1': {
						S: user
					},
					':2': nowObject,
					':3': {
						S: caption
					}
				},
				ConditionExpression: 'attribute_exists(#0) AND #1 = :1',
				UpdateExpression: 'SET #2=:2, #3=:3'
			})
			.promise();

		return {
			Attributes: {
				modified: now
			}
		};
	} catch (error) {
		return Promise.reject(errors.NOT_FOUND_VIDEO);
	}
}
