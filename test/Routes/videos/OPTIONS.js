import {standardOptionsTest} from '../../_helpers';

standardOptionsTest({
	allowMethods: [
		'OPTIONS',
		'POST',
	],
	path: [
		'videos',
	],
});
