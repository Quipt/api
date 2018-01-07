import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

export default async function(event, tables) {
	const {
		user,
		username,
		displayname,
		email,
		subscribe,
		DEBUG_TIME,
	} = event;

	if (!(user && username && displayname && email && subscribe !== undefined))
		return Promise.reject(errors.INVALID);

	const now = DEBUG_TIME || Date.now();
	const nowObject = {
		N: now.toString()
	};

	const {Count} = await dynamodb
		.query({
			TableName: tables.user,
			IndexName: 'username-index',
			KeyConditionExpression: 'username = :un',
			ExpressionAttributeValues: {
				':un': {
					S: username
				}
			},
			Select: 'COUNT',
			Limit: 1
		})
		.promise();

	if (Count)
		return Promise.reject(errors.USERNAME_TAKEN);

	try {
		await dynamodb
			.putItem({
				TableName: tables.user,
				Item: {
					id: {
						S: user
					},
					displayname: {
						S: displayname
					},
					email: {
						S: email
					},
					created: nowObject,
					modified: nowObject,
					subscribe: {
						BOOL: subscribe
					},
					username: {
						S: username
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
