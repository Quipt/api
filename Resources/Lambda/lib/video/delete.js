import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {
		user,
		board,
		video,
	} = event;

	if (!(user && board && video))
		return Promise.reject(errors.INVALID);

	try {
		await dynamodb
			.deleteItem({
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
					'#0': 'board',
					'#1': 'owner'
				},
				ExpressionAttributeValues: {
					':1': {
						S: user
					}
				},
				ConditionExpression: 'attribute_exists(#0) AND #1 = :1'
			})
			.promise();
	} catch (error) {
		return Promise.reject(errors.NOT_FOUND_VIDEO);
	}
}
