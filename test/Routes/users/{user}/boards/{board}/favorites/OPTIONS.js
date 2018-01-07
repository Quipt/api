import {standardOptionsTest} from '../../../../../../_helpers';
import FavoriteFixture from '../../../../../../fixtures/favorite';

const {
	user,
	board,
} = new FavoriteFixture();

standardOptionsTest({
	allowMethods: [
		'GET',
		'HEAD',
		'OPTIONS',
	],
	path: [
		'users',
		encodeURIComponent(user),
		'boards',
		board,
		'favorites',
	],
});
