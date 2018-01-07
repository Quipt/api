import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {
		user,
		owner,
		board,
		DEBUG_TIME,
	} = event;

	if (!(user && owner && board))
		return Promise.reject(errors.INVALID);

	const now = DEBUG_TIME || Date.now();
	const nowObject = {
		N: now.toString()
	};
	const id = Buffer.from(board, 'base64');

	// Check if the item exists in the board table
	const {Count} = await dynamodb
		.query({
			TableName: tables.board,
			ExpressionAttributeNames: {
				'#0': 'owner',
				'#1': 'id',
			},
			ExpressionAttributeValues: {
				':0': {
					S: owner
				},
				':1': {
					B: id
				},
			},
			KeyConditionExpression: '#0 = :0 AND #1 = :1',
			Select: 'COUNT'
		})
		.promise();

	if (!Count)
		return Promise.reject(errors.NOT_FOUND_BOARD);

	try {
		await dynamodb
			.putItem({
				TableName: tables.favorite,
				Item: {
					user: {
						S: user
					},
					owner: {
						S: owner
					},
					board: {
						B: id
					},
					created: nowObject
				},
				ExpressionAttributeNames: {
					'#0': 'board'
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
