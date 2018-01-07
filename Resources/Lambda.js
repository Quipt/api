import {resources} from '@evented/aws-api-gateway-framework';

export default new resources.AWSLambdaFunction({
	'FunctionName': 'quipt-backend',
	'Code': {
		'S3Bucket': {
			'Ref': 'LambdaS3Bucket'
		},
		'S3Key': {
			'Ref': 'LambdaS3Key'
		}
	},
	'Role': {
		'Fn::GetAtt': [
			'ExecutionRole',
			'Arn'
		]
	},
	'Timeout': 30,
	'Handler': 'index.handler',
	'Runtime': 'nodejs6.10',
	'MemorySize': 128,
	'Environment': {
		'Variables': {
			'S3_REGION': 'us-east-1'
		}
	}
});
