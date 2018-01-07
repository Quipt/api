import {DynamoDBIntegration, message} from '@evented/aws-api-gateway-framework';
import {responseItemArray} from '@evented/aws-api-gateway-framework/lib/velocity-tools';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...DynamoDBIntegration('Scan'),
	requestTemplate: [
		{
			TableName: 'quipt_${stageVariables.databaseVersion}-user',
			Limit: 10,
			ExpressionAttributeNames: {
				'#0': 'id',
				'#1': 'username',
				'#2': 'created',
				'#3': 'displayname',
			},
			ProjectionExpression: '#0, #1, #2, #3',
			Select: 'SPECIFIC_ATTRIBUTES',
		},
	],
	responses: [
		{
			SelectionPattern: '2\\d{2}',
			StatusCode: 200,
			headers: {
				'X-total': 'integration.response.body.Count'
			},
			template: responseItemArray,
			model: 'Empty',
		},
		{
			SelectionPattern: '4\\d{2}',
			StatusCode: 400,
			template: message('Invalid request'),
		}
	],
});
