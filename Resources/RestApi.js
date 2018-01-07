import {resources} from '@evented/aws-api-gateway-framework';

export default new resources.AWSApiGatewayRestApi({
	'Description': 'Quipt API',
	'Name': 'quipt'
});
