import {LambdaIntegration, message} from '@evented/aws-api-gateway-framework';
import {responseItem} from '@evented/aws-api-gateway-framework/lib/velocity-tools';
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
		['cognitoId', 'owner'],
		['uuid', 'board'],
		{
			operation: 'FavoriteRead',
			databaseVersion: '$stageVariables.databaseVersion',
			user: '$user',
			owner: '$owner',
			board: '$board'
		}
	],
	responses: [
		{
			StatusCode: 200,
			template: responseItem,
			model: 'Empty'
		},
		{
			SelectionPattern: '400.*',
			StatusCode: 400,
			template: message('Invalid request')
		},
		{
			SelectionPattern: '404.*',
			StatusCode: 404,
			template: message('Favorite not found')
		}
	],
});
