
import method from './GET';

method.raw.requestTemplate = [
	['cognitoId', 'user'],
	{
		TableName: 'quipt_${stageVariables.databaseVersion}-favorite',
		IndexName: 'user-created-index',
		ExpressionAttributeNames: {
			'#0': 'user'
		},
		ExpressionAttributeValues: {
			':0': {
				S: '$user'
			}
		},
		KeyConditionExpression: '#0 = :0',
		Select: 'COUNT'
	}
];

export default method;
