import {standardOptionsTest} from '../../../_helpers';
import UserFixture from '../../../fixtures/user';

const {
	id: user,
	username,
} = new UserFixture();

const allowMethods = [
	'GET',
	'HEAD',
	'OPTIONS',
	'PUT',
];

standardOptionsTest({
	allowMethods,
	path: [
		'users',
		encodeURIComponent(user)
	],
	name: 'Request by UserID'
});

standardOptionsTest({
	allowMethods,
	path: [
		'users',
		`@${username}`
	],
	name: 'Request by Username'
});
