import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();
const ExpressionAttributeNames = Object.freeze({
	'#0': 'name',
	'#1': 'created',
	'#2': 'modified',
});
const ProjectionExpression = Object.keys(ExpressionAttributeNames).join();

export default async function(event, tables) {
	const {user, board} = event;

	if (!(user && board))
		return Promise.reject(errors.INVALID);

	const data = await dynamodb
		.getItem({
			TableName: tables.board,
			Key: {
				owner: {
					S: user
				},
				id: {
					B: Buffer.from(board, 'base64')
				}
			},
			ExpressionAttributeNames,
			ProjectionExpression,
		})
		.promise();

	if (!data.Item)
		return Promise.reject(errors.NOT_FOUND_BOARD);

	return data;
}
