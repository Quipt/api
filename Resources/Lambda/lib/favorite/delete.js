import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {
		user,
		owner,
		board
	} = event;

	if (!(user && owner && board))
		return Promise.reject(errors.INVALID);

	try {
		await dynamodb
			.deleteItem({
				TableName: tables.favorite,
				Key: {
					user: {
						S: user
					},
					board: {
						B: Buffer.from(board, 'base64')
					}
				},
				ExpressionAttributeNames: {
					'#0': 'board',
					'#1': 'owner'
				},
				ExpressionAttributeValues: {
					':1': {
						S: owner
					}
				},
				ConditionExpression: 'attribute_exists(#0) AND #1 = :1'
			})
			.promise();
	} catch (error) {
		return Promise.reject(errors.NOT_FOUND_FAVORITE);
	}
}
