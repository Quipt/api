import {DynamoDBIntegration, message} from '@evented/aws-api-gateway-framework';
import {responseItemArray} from '@evented/aws-api-gateway-framework/lib/velocity-tools';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...DynamoDBIntegration('Query'),
	requestTemplate: [
		['cognitoId', 'user'],
		{
			TableName: 'quipt_${stageVariables.databaseVersion}-favorite',
			IndexName: 'user-created-index',
			ExpressionAttributeNames: {
				'#0': 'user',
				'#1': 'owner',
				'#2': 'board',
				'#3': 'created'
			},
			ExpressionAttributeValues: {
				':0': {
					S: '$user'
				}
			},
			KeyConditionExpression: '#0 = :0',
			ProjectionExpression: '#1, #2, #3',
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
