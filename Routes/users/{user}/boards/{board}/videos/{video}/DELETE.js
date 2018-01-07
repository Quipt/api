import {LambdaIntegration, message} from '@evented/aws-api-gateway-framework';
import {emptyTemplate} from '@evented/aws-api-gateway-framework/lib/velocity-tools';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...LambdaIntegration({
		'Fn::GetAtt': [
			'Lambda',
			'Arn'
		]
	}),
	requestTemplate: [
		['cognitoId', 'user'],
		['uuid', 'board'],
		['uuid', 'video'],
		{
			operation: 'VideoDelete',
			databaseVersion: '$stageVariables.databaseVersion',
			cognitoIdentityId: '$context.identity.cognitoIdentityId',
			user: '$user',
			board: '$board',
			video: '$video'
		}
	],
	responses: [
		{
			StatusCode: 204,
			template: emptyTemplate,
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
		}
	]
});
