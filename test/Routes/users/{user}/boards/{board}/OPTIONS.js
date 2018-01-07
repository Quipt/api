import {standardOptionsTest} from '../../../../../_helpers';
import BoardFixture from '../../../../../fixtures/board';

const {
	owner: user,
	id: board,
} = new BoardFixture();

standardOptionsTest({
	allowMethods: [
		'DELETE',
		'GET',
		'HEAD',
		'OPTIONS',
		'PATCH',
	],
	path:  [
		'users',
		encodeURIComponent(user),
		'boards',
		board
	]
});
