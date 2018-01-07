import {LambdaIntegration, message} from '@evented/aws-api-gateway-framework';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...LambdaIntegration({
		'Fn::GetAtt': [
			'Lambda',
			'Arn'
		]
	}),
	model: 'VideoPUTRequest',
	requestTemplate: [
		['cognitoId', 'user'],
		['uuid', 'board'],
		['uuid', 'video'],
		['string', 'caption', 120],
		{
			operation: 'VideoCreate',
			databaseVersion: '$stageVariables.databaseVersion',
			cognitoIdentityId: '$context.identity.cognitoIdentityId',
			user: '$user',
			board: '$board',
			video: '$video',
			caption: '$caption'
		}
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
			SelectionPattern: '404.*',
			StatusCode: 404,
			template: message('Video not found')
		},
		{
			SelectionPattern: '409.*',
			StatusCode: 409,
			template: message('Video already exists on this board')
		}
	]
});
