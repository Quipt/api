import BoardCreate from './lib/board/create';
import BoardRead from './lib/board/read';
import BoardUpdate from './lib/board/update';
import BoardDelete from './lib/board/delete';
import FavoriteCreate from './lib/favorite/create';
import FavoriteRead from './lib/favorite/read';
import FavoriteDelete from './lib/favorite/delete';
import VideoCreate from './lib/video/create';
import VideoRead from './lib/video/read';
import VideoUpdate from './lib/video/update';
import VideoDelete from './lib/video/delete';
import TokensCreate from './lib/tokens/create';
import UserCreate from './lib/user/create';

const operations = {
	BoardCreate,
	BoardRead,
	BoardUpdate,
	BoardDelete,
	FavoriteCreate,
	FavoriteRead,
	FavoriteDelete,
	VideoCreate,
	VideoRead,
	VideoUpdate,
	VideoDelete,
	TokensCreate,
	UserCreate,
};

const tableNames = [
	'board',
	'favorite',
	'hash',
	'user',
	'video'
];

const unsafeOperations = /(Create|Update|Delete)$/;

/**
 * Lambda Function Handler
 * 
 * @param event {!Object}
 * @param operation {!string}
 * @param databaseVersion {!string}
 * @param cognitoIdentityId {string}
 * @param user {string}
 * @param video {string}
 * @param caption {string}
 * @param name {string}
 * @param board {string}
 * @param owner {string}
 * @param context {Object}
 * @param callback {!function}
 */
export async function handler(event, context, callback) {
	console.log(event);

	const {
		operation,
		databaseVersion,
		cognitoIdentityId,
		user
	} = event;

	const prefix = `quipt_${databaseVersion}-`;
	const tables = {};

	for (const tableName of tableNames)
		tables[tableName] = `${prefix}${tableName}`;

	try {
		if (
			unsafeOperations.test(operation) &&
			(
				!('cognitoIdentityId' in event) ||
				!cognitoIdentityId ||
				(
					'user' in event &&
					user !== cognitoIdentityId
				)
			)
		)
			return callback('401: Unauthorized');


		if (!(operation in operations))
			return callback('Unknown operation');

		callback(null, await operations[operation](event, tables));
	} catch (error) {
		callback(error);
	}
}