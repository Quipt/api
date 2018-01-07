import {LambdaIntegration, message} from '@evented/aws-api-gateway-framework';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...LambdaIntegration({
		'Fn::GetAtt': [
			'Lambda',
			'Arn'
		]
	}),
	model: 'BoardsPOSTRequest',
	requestTemplate: [
		['cognitoId', 'user'],
		['string', 'name', 120],
		{
			operation: 'BoardCreate',
			databaseVersion: '$stageVariables.databaseVersion',
			cognitoIdentityId: '$context.identity.cognitoIdentityId',
			user: '$user',
			name: `$input.path('$.name')`
		}
	],
	responses: [
		{
			StatusCode: 201,
			headers: {
				'Location': 'integration.response.body.Location'
			},
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
			SelectionPattern: '409.*',
			StatusCode: 409,
			template: message('Conflict generating Board ID')
		}
	]
});
