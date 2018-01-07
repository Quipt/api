import DynamoDB from 'aws-sdk/clients/dynamodb';
import errors from './errors';

const dynamodb = new DynamoDB();

const attrs = [
	'owner',
	'created',
	'modified',
	'caption'
];

const ExpressionAttributeNames = {};

for (const key of Object.keys(attrs))
	ExpressionAttributeNames[`#${key}`] = attrs[key];

const ProjectionExpression = Object
	.keys(ExpressionAttributeNames)
	.join();

export default async function(event, tables) {
	const {
		user,
		board,
		video,
	} = event;

	if (!(user && board && video))
		return Promise.reject(errors.INVALID);

	const data = await dynamodb
		.getItem({
			TableName: tables.video,
			Key: {
				board: {
					B: Buffer.from(board, 'base64')
				},
				id: {
					B: Buffer.from(video, 'base64')
				}
			},
			ExpressionAttributeNames,
			ProjectionExpression
		})
		.promise();

	const {Item} = data;

	if (!Item || Item.owner.S !== user)
		return Promise.reject(errors.NOT_FOUND_VIDEO);

	delete Item.owner;

	return data;
}
