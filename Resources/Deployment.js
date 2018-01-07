import {resources} from '@evented/aws-api-gateway-framework';

export default new resources.AWSApiGatewayDeployment({
	'RestApiId': {
		'Ref': 'RestApi'
	},
	'StageName': 'DummyStage',
	'Description': 'Dummy Stage for the API'
});
