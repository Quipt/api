import DynamoDB from 'aws-sdk/clients/dynamodb';
import uuid from 'node-uuid';
import errors from './errors';
import {binaryToBase64Safe} from '../utils.js';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {
		user,
		name,
		DEBUG_ID,
		DEBUG_TIME,
	} = event;

	if (!(user && name))
		return Promise.reject(errors.INVALID);

	const id = DEBUG_ID || uuid.v1(null, Buffer.alloc(16));
	const now = DEBUG_TIME || Date.now();
	const nowObject = {
		N: now.toString()
	};

	try {
		await dynamodb.putItem({
			TableName: tables.board,
			Item: {
				owner: {
					S: user
				},
				id: {
					B: id
				},
				name: {
					S: name
				},
				created: nowObject,
				modified: nowObject
			},
			ExpressionAttributeNames: {
				'#0': 'id'
			},
			ConditionExpression: 'attribute_not_exists(#0)'
		})
		.promise();

		return {
			Location: binaryToBase64Safe(id),
			Attributes: {
				created: now
			}
		};
	} catch (error) {
		return Promise.reject(errors.CONFLICT);
	}
}
