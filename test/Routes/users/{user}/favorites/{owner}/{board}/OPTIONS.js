import {standardOptionsTest} from '../../../../../../_helpers';
import FavoriteFixture from '../../../../../../fixtures/favorite';

const {
	user,
	owner,
	board,
} = new FavoriteFixture();

standardOptionsTest({
	allowMethods: [
		'DELETE',
		'GET',
		'HEAD',
		'OPTIONS',
		'PUT',
	],
	path: [
		'users',
		encodeURIComponent(user),
		'favorites',
		encodeURIComponent(owner),
		board,
	],
});
