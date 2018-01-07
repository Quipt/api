import {LambdaIntegration, message} from '@evented/aws-api-gateway-framework';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...LambdaIntegration({
		'Fn::GetAtt': [
			'Lambda',
			'Arn'
		]
	}),
	model: 'UserPUTRequest',
	requestTemplate: [
		['cognitoId', 'user'],
		['string', 'username', 40],
		['string', 'displayname', 40],
		['string', 'email', 254],
		`{
			"operation": "UserCreate",
			"databaseVersion": "$stageVariables.databaseVersion",
			"cognitoIdentityId": "$context.identity.cognitoIdentityId",
			"user": "$user",
			"username": "$username",
			"displayname": "$displayname",
			"email": "$email",
			"subscribe": $input.path('$.subscribe')
		}`
	],
	responses: [
		{
			StatusCode: 201,
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
			SelectionPattern: '409: User already exists',
			StatusCode: 409,
			template: message('User already exists')
		}
	]
});
