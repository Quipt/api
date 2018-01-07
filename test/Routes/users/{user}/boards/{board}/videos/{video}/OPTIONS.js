import {standardOptionsTest} from '../../../../../../../_helpers';
import VideoFixture from '../../../../../../../fixtures/video';

const {
	owner: user,
	board,
	id: video
} = new VideoFixture();

standardOptionsTest({
	allowMethods: [
		'DELETE',
		'GET',
		'HEAD',
		'OPTIONS',
		'PATCH',
		'PUT',
	],
	path: [
		'users',
		encodeURIComponent(user),
		'boards',
		board,
		'videos',
		video,
	]
});
