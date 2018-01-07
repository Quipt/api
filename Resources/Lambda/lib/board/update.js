import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {
		user,
		board,
		name,
		DEBUG_TIME,
	} = event;

	if (!(user && board && name))
		return Promise.reject(errors.INVALID);

	const now = DEBUG_TIME || Date.now();
	const nowObject = {
		N: now.toString()
	};

	try {
		await dynamodb
			.updateItem({
				TableName: tables.board,
				Key: {
					owner: {
						S: user
					},
					id: {
						B: Buffer.from(board, 'base64')
					}
				},
				ExpressionAttributeNames: {
					'#0': 'id',
					'#1': 'name',
					'#2': 'modified'
				},
				ExpressionAttributeValues: {
					':1': {
						S: name
					},
					':2': nowObject
				},
				ConditionExpression: 'attribute_exists(#0)',
				UpdateExpression: 'SET #1=:1, #2=:2'
			})
			.promise();

		return {
			Attributes: {
				modified: now
			}
		};
	} catch (error) {
		return Promise.reject(errors.NOT_FOUND_BOARD);
	}
}
