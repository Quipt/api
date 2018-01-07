import {resources} from '@evented/aws-api-gateway-framework';

export default new resources.AWSIAMRole({
	'AssumeRolePolicyDocument': {
		'Version': '2012-10-17',
		'Statement': [
			{
				'Effect': 'Allow',
				'Principal': {
					'Service': [
						'lambda.amazonaws.com'
					]
				},
				'Action': [
					'sts:AssumeRole'
				]
			}
		]
	},
	'Path': '/',
	'Policies': [
		{
			'PolicyName': 'ExecutionRolePolicy',
			'PolicyDocument': {
				'Version': '2012-10-17',
				'Statement': [
					{
						'Effect': 'Allow',
						'Action': 'logs:*',
						'Resource': 'arn:aws:logs:*:*:*'
					},
					{
						'Effect': 'Allow',
						'Action': [
							'dynamodb:BatchGetItem',
							'dynamodb:BatchWriteItem',
							'dynamodb:GetItem',
							'dynamodb:DeleteItem',
							'dynamodb:PutItem',
							'dynamodb:Query',
							'dynamodb:UpdateItem'
						],
						'Resource': {
							'Fn::Sub': 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/quipt_dev-*'
						}
					},
					{
						'Effect': 'Allow',
						'Action': [
							's3:PutObject'
						],
						'Resource': 'arn:aws:s3:::u.dev.qui.pt/*'
					}
				]
			}
		}
	]
});
