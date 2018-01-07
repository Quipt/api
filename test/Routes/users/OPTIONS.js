import {standardOptionsTest} from '../../_helpers';

standardOptionsTest({
	allowMethods: [
		'GET',
		'HEAD',
		'OPTIONS',
	],
	path: [
		'users',
	],
});
