import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {user, board} = event;

	if (!(user && board))
		return Promise.reject(errors.INVALID);

	try {
		await dynamodb
			.deleteItem({
				TableName: tables.board,
				Key: {
					owner: {
						S: user,
					},
					id: {
						B: Buffer.from(board, 'base64')
					}
				},
				ExpressionAttributeNames: {
					'#0': 'id'
				},
				ConditionExpression: 'attribute_exists(#0)'
			})
			.promise();
	} catch (error) {
		return Promise.reject(errors.NOT_FOUND_BOARD);
	}
}
