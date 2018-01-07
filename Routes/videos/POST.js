import {LambdaIntegration, message} from '@evented/aws-api-gateway-framework';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...LambdaIntegration({
		'Fn::GetAtt': [
			'Lambda',
			'Arn'
		]
	}),
	model: 'VideosPOSTRequest',
	requestTemplate: [`
		#set( $files = $input.path('$') )
		#if( $files.getClass().getName() != 'net.minidev.json.JSONArray' || $files.size() < 1 )
			#set( $files = '""' )
		#else
			#foreach( $file in $files )
				#if(
					!(
						$file.name
						&& $file.size
						&& $file.type
						&& $file.hash
					)
					|| $file.name.getClass().getName() != 'java.lang.String'
					|| $file.size.getClass().getName() != 'java.lang.Integer'
					|| $file.type.getClass().getName() != 'java.lang.String'
					|| !$file.type.matches('^video/(avi|mp(eg|4)|ogg|quicktime|webm|x-(matroska|ms-wmv|flv))$')
					|| $file.hash.getClass().getName() != 'java.lang.String'
					|| !$file.hash.matches('^[0-9a-f]{64}$')
					|| (
						$file.index
						&& (
							$file.index.getClass().getName() != 'java.lang.Integer'
							|| $file.index < 0
						)
					)
				)
					#set( $files = '""' )
					#break
				#end
			#end
		#end
		{
			"operation": "TokensCreate",
			"databaseVersion": "$stageVariables.databaseVersion",
			"cognitoIdentityId": "$context.identity.cognitoIdentityId",
			"bucket": "$stageVariables.uploadBucket",
			"files": $files 
		}
	`],
	responses: [
		{
			StatusCode: 201,
			template: `$input.json('$')`,
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
		}
	],
});
