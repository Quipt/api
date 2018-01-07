import {DynamoDBIntegration, message} from '@evented/aws-api-gateway-framework';
import {minify} from '@evented/aws-api-gateway-framework/lib/velocity-tools';
import Method from '@evented/aws-api-gateway-framework/lib/Method';

export default new Method({
	...DynamoDBIntegration('Query'),
	requestTemplate: [`
		#set( $user = $util.urlDecode($input.params('user')) )
		#if( $user.matches('^@[0-9a-zA-Z]{1,20}$') )
			#set( $selectByName = true )
			#set( $userValue = $user.substring(1) )
		#else
			#set( $selectByName = false )
			#set( $userValue = $user )
		#end
		#if( !$selectByName && !$user.matches('^[a-z]{2}-[a-z]{4,9}-\\d:[\\da-f]{4}([\\da-f]{4}-){4}[\\da-f]{12}$') )
			#set ( $userValue = '' )
		#end
		{
			"TableName": "quipt_\${stageVariables.databaseVersion}-user",
			#if( $selectByName )
				"IndexName": "username-index",
			#end
			"Limit": 1,
			"ExpressionAttributeNames": {
				#if( $selectByName )
					"#0": "username",
					"#1": "id",
				#else
					"#0": "id",
					"#1": "username",
				#end
				"#2": "created",
				"#3": "displayname"
			},
			"ExpressionAttributeValues": {
				":0": {
					"S": "$userValue"
				}
			},
			"KeyConditionExpression": "#0 = :0",
			"ProjectionExpression": "#1, #2, #3"
		}
	`],
	responses: [
		{
			StatusCode: 200,
			template: minify(`
				#if( $input.path('$.Count') < 1 )
					{
						"Error": "User not found"
					}
				#else
					#set( $item = $input.path('$.Items')[0] )
					{
					#foreach( $key in $item.keySet() )
						#set( $type = $item[$key].keySet().iterator().next() )
						#if($type == 'S' || $type == 'B')
							#set($q = '"')
						#else
							#set($q = '')
						#end
						"$key": $q$item[$key].values().iterator().next()$q
						#if($foreach.hasNext),#end
					#end
					}
				#end
			`),
			model: 'Empty'
		},
		{
			SelectionPattern: '4\\d{2}',
			StatusCode: 400,
			template: message('Invalid request')
		}
	],
});
