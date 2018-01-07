import method from './GET';

method.raw.requestTemplate = [
	['cognitoId', 'user'],
	['uuid', 'board'],
	['uuid', 'video'],
	{
		operation: 'VideoRead',
		databaseVersion: '$stageVariables.databaseVersion',
		user: '$user',
		board: '$board',
		video: '$video'
	}
];

export default method;
