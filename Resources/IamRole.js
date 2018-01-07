import {resources} from '@evented/aws-api-gateway-framework';

export default new resources.AWSIAMRole({
	'AssumeRolePolicyDocument': {
		'Version': '2012-10-17',
		'Statement': [
			{
				'Sid': '',
				'Effect': 'Allow',
				'Principal': {
					'Service': 'apigateway.amazonaws.com'
				},
				'Action': 'sts:AssumeRole'
			}
		]
	},
	'Path': '/',
	'Policies': [
		{
			'PolicyName': 'root',
			'PolicyDocument': {
				'Version': '2012-10-17',
				'Statement': [
					{
						'Effect': 'Allow',
						'Action': [
							'dynamodb:DeleteItem',
							'dynamodb:GetItem',
							'dynamodb:PutItem',
							'dynamodb:Query',
							'dynamodb:Scan',
							'dynamodb:UpdateItem'
						],
						'Resource': {
							'Fn::Sub': 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/quipt_dev-*'
						}
					},
					{
						'Effect': 'Allow',
						'Action': 'lambda:InvokeFunction',
						'Resource': {
							'Fn::GetAtt': [
								'Lambda',
								'Arn'
							]
						}
					}
				]
			}
		}
	]
});
