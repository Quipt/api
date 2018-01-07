
import method from './GET';

method.raw.requestTemplate = [
	{
		TableName: 'quipt_${stageVariables.databaseVersion}-user',
		Limit: 10,
		Select: 'COUNT',
	},
];

export default method;
