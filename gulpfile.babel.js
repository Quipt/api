import fs from 'fs';
import gulp from 'gulp';
import del from 'del';
import babel from 'gulp-babel';
import chmod from 'gulp-chmod';
import install from 'gulp-install';
import zip from 'gulp-zip';
import runSequence from 'run-sequence';
import AWS from 'aws-sdk';
import * as builder from '@evented/aws-api-gateway-framework/lib/builder';

const s3 = new AWS.S3();
const cloudformation = new AWS.CloudFormation();
const apigateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();

const {
	CONFIG_BUCKET,
	STAGE = 'dev',
	STACK_NAME: StackName
} = process.env;

gulp.task('build-cloudformation', async () => {
	await builder.write(__dirname);
});

gulp.task('clean', () =>
	del([
		'./build/*',
		'./Resources/Lambda/dist/*'
	])
);

gulp.task('transpile', () => gulp
	.src([
		'**/*.js',
		'!node_modules/**/*',
		'!test/**/*',
	], {cwd: './Resources/Lambda'})
	.pipe(babel({
		presets: [
			'stage-2',
			[
				'env',
				{
					targets: {
						node: '6.10'
					}
				}
			]
		],
		env: 'production',
		comments: false,
		compact: true,
	}))
	.pipe(gulp.dest('./dist', {
		base: '.',
		cwd: './Resources/Lambda'
	}))
);

gulp.task('npm', () => gulp
	.src([
		'package.json',
	], {cwd: './Resources/Lambda'})
	.pipe(gulp.dest('./dist', {
		base: '.',
		cwd: './Resources/Lambda'
	}))
	.pipe(install({
		production: true,
		ignoreScripts: true
	}))
);

// Now the dist directory is ready to go. Zip it.
gulp.task('zip', () => gulp
	.src([
		'**/*',
		'!./package.json',
		'!**/LICENSE',
		'!**/*.md'
	], { cwd: './Resources/Lambda/dist' })
	.pipe(chmod(0o555))
	.pipe(zip('Lambda.zip'))
	.pipe(gulp.dest('./build'))
);

gulp.task('build-lambda', cb =>
	runSequence(
		'clean',
		[
			'transpile',
			'npm'
		],
		'zip',
		cb
	)
);

gulp.task('build', cb =>
	runSequence(
		'clean',
		[
			'build-cloudformation',
			'transpile',
			'npm'
		],
		'zip',
		cb
	)
);

gulp.task('upload', () => {
	const uploads = [
		{
			localName: 'CloudFormation.json',
			remoteName: 'CloudFormation.template'
		},
		{
			localName: 'Lambda.zip',
			remoteName: 'Lambda.zip'
		}
	].map(({localName, remoteName}) => s3
		.putObject({
			Bucket: CONFIG_BUCKET,
			Key: `${STAGE}/api-gateway/${remoteName}`,
			Body: fs.createReadStream(`build/${localName}`)
		})
		.promise()
	);

	return Promise.all(uploads);
});

gulp.task('update-stack', async () => {
	let operation = 'updateStack';
	let restApiId;

	try {
		const data = await cloudformation
			.describeStacks({ StackName })
			.promise();

		restApiId = data
			.Stacks[0]
			.Outputs
			.find(item => item.OutputKey === 'RestApi')
			.OutputValue;
	} catch (e) {
		operation = 'createStack';
	}

	try {
		await cloudformation
			[operation]({
				StackName,
				TemplateURL: `https://s3.amazonaws.com/${CONFIG_BUCKET}/${STAGE}/api-gateway/CloudFormation.template`,
				Capabilities: [ 'CAPABILITY_IAM' ],
				Parameters: Object.entries({
					StageName: STAGE,
					UploadBucket: UPLOAD_BUCKET,
					LambdaS3Bucket: CONFIG_BUCKET,
					LambdaS3Key: `${STAGE}/api-gateway/Lambda.zip`,
				}).map(
					([ ParameterKey, ParameterVaue ]) => ({ ParameterKey, ParameterValue })
				)
			})
			.promise();
	} catch (e) {
		return;
	}

	await cloudformation
		.waitFor('stackUpdateComplete', { StackName })
		.promise();
	
	await apigateway
		.createDeployment({
			restApiId,
			stageName: STAGE,
		})
		.promise();
});

gulp.task('update-lambda-code', async () => {
	const {
		StackResourceDetail: {
			PhysicalResourceId,
		},
	} = await cloudformation
		.describeStackResource({
			StackName,
			LogicalResourceId: 'Lambda'
		})
		.promise();
	
	await lambda
		.updateFunctionCode({
			FunctionName: PhysicalResourceId,
			S3Bucket: CONFIG_BUCKET,
			S3Key: `${STAGE}/api-gateway/Lambda.zip`
		})
		.promise();
});

gulp.task('update-lambda', cb => {
	runSequence(
		'build',
		'upload',
		'update-lambda-code',
		cb
	);
});

gulp.task('update', cb => {
	runSequence(
		'build',
		'upload',
		'update-stack',
		cb
	);
});

gulp.task('update-all', cb => {
	runSequence(
		'build',
		'upload',
		'update-lambda-code',
		'update-stack',
		cb
	);
});
