import {standardOptionsTest} from '../../../../_helpers';
import UserFixture from '../../../../fixtures/user';

const { id: user } = new UserFixture();

standardOptionsTest({
	allowMethods: [
		'GET',
		'HEAD',
		'OPTIONS',
	],
	path: [
		'users',
		encodeURIComponent(user),
		'favorites',
	],
});
