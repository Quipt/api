import method from './GET';

method.raw.requestTemplate = [
	['cognitoId', 'user'],
	['cognitoId', 'owner'],
	['uuid', 'board'],
	{
		operation: 'FavoriteRead',
		databaseVersion: '$stageVariables.databaseVersion',
		user: '$user',
		owner: '$owner',
		board: '$board'
	}
];

export default method;
