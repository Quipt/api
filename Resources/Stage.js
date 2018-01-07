import {resources} from '@evented/aws-api-gateway-framework';

export default new resources.AWSApiGatewayStage({
	'DeploymentId': {
		'Ref': 'Deployment'
	},
	'Description': 'Development',
	'MethodSettings': [],
	'RestApiId': {
		'Ref': 'RestApi'
	},
	'StageName': {
		'Ref': 'StageName'
	},
	'Variables': {
		'databaseVersion': {
			'Ref': 'DatabaseVersion'
		},
		'uploadBucket': {
			'Ref': 'UploadBucket'
		}
	}
});
