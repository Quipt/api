import {standardOptionsTest} from '../../../../../../_helpers';
import BoardFixture from '../../../../../../fixtures/board';

const {
	owner: user,
	board,
} = new BoardFixture();

standardOptionsTest({
	allowMethods: [
		'GET',
		'HEAD',
		'OPTIONS'
	],
	path: [
		'users',
		encodeURIComponent(user),
		'boards',
		board,
		'videos'
	]
});
