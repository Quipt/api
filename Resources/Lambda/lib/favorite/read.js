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

	const data = await dynamodb
		.getItem({
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
				'#0': 'created'
			},
			ProjectionExpression: '#0'
		})
		.promise();

	if (!data.Item)
		return Promise.reject(errors.NOT_FOUND_FAVORITE);

	return data;
}
