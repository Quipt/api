
import method from './GET';

method.raw.requestTemplate = [`
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
				"#0": "username"
			#else
				"#0": "id"
			#end
		},
		"ExpressionAttributeValues": {
			":0": {
				"S": "$userValue"
			}
		},
		"KeyConditionExpression": "#0 = :0"
	}
`];

export default method;
