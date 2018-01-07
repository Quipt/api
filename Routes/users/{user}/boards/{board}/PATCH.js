import {LambdaIntegration, message} from '@evented/aws-api-gateway-framework';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...LambdaIntegration({
		'Fn::GetAtt': [
			'Lambda',
			'Arn'
		]
	}),
	model: 'BoardPATCHRequest',
	requestTemplate: [
		['cognitoId', 'user'],
		['uuid', 'board'],
		['string', 'name', 120],
		{
			operation: 'BoardUpdate',
			databaseVersion: '$stageVariables.databaseVersion',
			cognitoIdentityId: '$context.identity.cognitoIdentityId',
			user: '$user',
			board: '$board',
			name: '$name',
		}
	],
	responses: [
		{
			StatusCode: 200,
			template: `$input.json('$.Attributes')`,
			model: 'Empty'
		},
		{
			SelectionPattern: '400.*',
			StatusCode: 400,
			template: message('Invalid request')
		},
		{
			SelectionPattern: '401.*',
			StatusCode: 401,
			template: message('Unauthorized')
		},
		{
			SelectionPattern: '404.*',
			StatusCode: 404,
			template: message('Board not found')
		}
	]
});
