import {DynamoDBIntegration, message} from '@evented/aws-api-gateway-framework';
import {responseItemArray} from '@evented/aws-api-gateway-framework/lib/velocity-tools';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...DynamoDBIntegration('Query'),
	requestTemplate: [
		['cognitoId', 'user'],
		['uuid', 'board'],
		{
			TableName: 'quipt_${stageVariables.databaseVersion}-favorite',
			IndexName: 'board-created-index',
			ExpressionAttributeNames: {
				'#0': 'board',
				'#1': 'user',
				'#2': 'owner',
				'#3': 'created'
			},
			ExpressionAttributeValues: {
				':0': {
					B: '$board'
				},
				':1': {
					S: '$user'
				}
			},
			KeyConditionExpression: '#0 = :0',
			FilterExpression: '#1 = :1',
			ProjectionExpression: '#2, #3',
			ScanIndexForward: false,
			Select: 'SPECIFIC_ATTRIBUTES'
		}
	],
	responses: [
		{
			SelectionPattern: '2\\d{2}',
			StatusCode: 200,
			headers: {
				'X-total': 'integration.response.body.Count'
			},
			template: responseItemArray,
			model: 'Empty'
		},
		{
			SelectionPattern: '4\\d{2}',
			StatusCode: 400,
			template: message('Invalid request')
		}
	],
});
