import {config} from '@evented/aws-api-gateway-framework';
import method from './GET';

method.raw.requestTemplate = [
	['cognitoId', 'user'],
	['uuid', 'board'],
	{
		TableName: 'quipt_${stageVariables.databaseVersion}-favorite',
		IndexName: 'board-created-index',
		ExpressionAttributeNames: {
			'#0': 'board',
			'#1': 'owner'
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
		Select: 'COUNT'
	}
];

export default method;
