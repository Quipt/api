import {resources} from '@evented/aws-api-gateway-framework';

export default new resources.AWSApiGatewayRequestValidator({
	Name: 'validator',
	RestApiId: {
		Ref: 'RestApi'
	},
	ValidateRequestBody: true,
	//ValidateRequestParameters: false,
});
