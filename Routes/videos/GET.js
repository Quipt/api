import {message} from '@evented/aws-api-gateway-framework';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	Type: 'MOCK',
	requestTemplate: [
		{
			statusCode: 200
		}
	],
	responses: [
		{
			StatusCode: 405,
			template: message('Method not allowed'),
			model: 'Error'
		}
	],
});
