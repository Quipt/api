import {DynamoDBIntegration} from '@evented/aws-api-gateway-framework';
import Method from '@evented/aws-api-gateway-framework/lib/Method';
import GET from './GET';

export default new Method({
	...DynamoDBIntegration('Query'),
	requestTemplate: [
		['cognitoId', 'user'],
		{
			TableName: 'quipt_${stageVariables.databaseVersion}-board',
			ExpressionAttributeNames: {
				'#0': 'owner'
			},
			ExpressionAttributeValues: {
				':0': {
					S: '$user'
				}
			},
			KeyConditionExpression: '#0 = :0',
			Select: 'COUNT'
		}
	],
	responses: GET.raw.responses
});
