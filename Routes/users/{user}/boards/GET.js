import {DynamoDBIntegration, message} from '@evented/aws-api-gateway-framework';
import {responseItemArray} from '@evented/aws-api-gateway-framework/lib/velocity-tools';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...DynamoDBIntegration('Query'),
	requestTemplate: [
		['cognitoId', 'user'],
		{
			TableName: 'quipt_${stageVariables.databaseVersion}-board',
			// IndexName: 'board-created-index', TODO: List by modified or created
			ExpressionAttributeNames: {
				'#0': 'owner',
				'#1': 'id',
				'#2': 'created',
				'#3': 'modified',
				'#4': 'name'
			},
			ExpressionAttributeValues: {
				':0': {
					S: '$user'
				}
			},
			KeyConditionExpression: '#0 = :0',
			ProjectionExpression: '#1, #2, #3, #4',
			// ScanIndexForward: false,
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
