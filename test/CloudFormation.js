import assert from 'assert';
import fs from 'fs';
import path from 'path';

import test from 'ava';

import jsonFile from '../build/CloudFormation.json';

function methodTests(cfnResources, resourceId, paths, methods, method) {
	const logicalId = resourceId + method;
	const {Properties} = cfnResources[logicalId];
	const {Integration, MethodResponses, AuthorizationType, ResourceId} = Properties;
	const {IntegrationResponses, RequestTemplates} = Integration;
	const prefix = `/${paths[ResourceId.Ref]} ${method}`;

	test(`${prefix} should have an API test file`, () => {
		const testPath = path.join(__dirname, 'Routes', paths[ResourceId.Ref], `${method}.js`);

		assert.ok(
			fs.existsSync(testPath)
		);
	});

	test(`${prefix} should have all of the integration response parameters enabled in the method response`, () => {
		for (const integrationResponse of IntegrationResponses) {
			const methodResponse = MethodResponses
				.find(item => item.StatusCode === integrationResponse.StatusCode);

			for (const responseParameter of Object.keys(integrationResponse.ResponseParameters)) {
				assert.strictEqual(
					methodResponse.ResponseParameters[responseParameter],
					true,
					`${methodResponse.ResponseParameters[responseParameter]} not found in ${methodResponse.StatusCode} Method Response`
				);
			}
		}
	});

	// Check if 204 responses are blank
	for (const integrationResponse of IntegrationResponses.filter(item => item.StatusCode === '204')) {
		test(`${prefix} should have a blank integration response template for a 204 status code`, () => assert
			.strictEqual(
				integrationResponse.ResponseTemplates['application/json'],
				'##',
				'Response template is not a one-line comment'
			)
		);
	}

	if (method !== 'HEAD') {
		test(`${prefix} should use the error response template for all 4XX responses`, () => {
			for (const methodResponse of MethodResponses) {
				if (/^4/.test(methodResponse.StatusCode))
					assert.strictEqual(
						methodResponse.ResponseModels['application/json'],
						'Error'
					);
			}
		});
	}

	const isUnsafeMethod = /^(DELETE|PATCH|POST|PUT)$/.test(method);
	// method unsafe methods should require authorization
	test(`${prefix} should have the correct authorization type`, () => assert
		.strictEqual(
			AuthorizationType,
			isUnsafeMethod ? 'AWS_IAM' : 'NONE'
		)
	);

	if (isUnsafeMethod) {
		test(`${prefix} should have a 401 status code`, () => assert
			.ok(
				MethodResponses.some(methodResponse => methodResponse.StatusCode === '401')
			)
		);
	}

	if (method !== 'OPTIONS') {
		test(`${prefix} should have a request template`, () => {
			const {RequestTemplates} = Integration;
			assert.ok(RequestTemplates && RequestTemplates['application/json']);
		});

		test(`${prefix} should have the correct passthrough behavior`, () => assert
			.strictEqual(
				Integration.PassthroughBehavior,
				'NEVER'
			)
		);
	}

	if(/^P(OS|U)T$/.test(method)) {
		test(`${prefix} should have a 201 response`, () => assert
			.ok(IntegrationResponses.some(item => item.StatusCode === '201'))
		);

		test(`${prefix} should have a Lambda function as the integration type`, () => {
		// 	const joinArray = Integration.Uri['Fn::Join'][1];
		//
			assert.strictEqual(Integration.Type, 'AWS');
		// 	assert.strictEqual(joinArray[0], 'arn:aws:apigateway:');
		// 	assert.strictEqual(joinArray[2], ':lambda:path/2015-03-31/functions/');
		// 	assert.strictEqual(joinArray[4], '/invocations');
		});
	}

	switch (method) {
		case 'OPTIONS':
			test(`${prefix} should have the correct authorization type`, () => assert
				.strictEqual(AuthorizationType, 'NONE')
			);

			test(`${prefix} should have the correct passthrough behavior`, () => assert
				.strictEqual(
					Integration.PassthroughBehavior,
					'WHEN_NO_MATCH'
				)
			);

			const allowMethods = methods
				.filter(_method => cfnResources[`${resourceId}${_method}`]
					.Properties
					.MethodResponses[0]
					.StatusCode !== '405'
				)
				.join();

			const integrationResponseParameters = {
				'method.response.header.Access-Control-Allow-Headers': `'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'`,
				'method.response.header.Access-Control-Allow-Methods': `'${allowMethods}'`,
				'method.response.header.Access-Control-Allow-Origin': `'*'`
			};

			const integrationResponse = IntegrationResponses[0];

			test(`${prefix} should have the correct integration response status code`, () => assert
				.strictEqual(integrationResponse.StatusCode, '200')
			);

			test(`${prefix} should have the proper integration response parameters`, () => assert
				.deepStrictEqual(
					integrationResponseParameters,
					integrationResponse.ResponseParameters,
					`The response parameters for ${logicalId} are invalid`
				)
			);

			test(`${prefix} should have the correct integration passthrough behavior`, () => assert
				.strictEqual(Integration.PassthroughBehavior, 'WHEN_NO_MATCH')
			);

			test(`${prefix} should have the correct integration request templates`, () => assert
				.deepStrictEqual(
					RequestTemplates,
					{
						'application/json': '{"statusCode":200}'
					}
				)
			);

			test(`${prefix} should have the correct integration type`, () => assert
				.strictEqual(Integration.Type, 'MOCK')
			);

			const methodResponseParameters = Object.keys(integrationResponseParameters);
			const methodResponse = MethodResponses[0];

			test(`${prefix} should have the correct method response status code`, () => assert
				.strictEqual(methodResponse.StatusCode, '200')
			);

			test(`${prefix} should have the correct method response parameters`, () => {
				for (const parameter of methodResponseParameters) {
					assert.strictEqual(methodResponse.ResponseParameters[parameter], true);
				}
			});
			break;
		case 'HEAD':
			test(`${prefix} should have the same number of integration responses as the GET method`, () => assert
				.strictEqual(
					IntegrationResponses.length,
					cfnResources[`${resourceId}GET`]
						.Properties
						.Integration
						.IntegrationResponses
						.length
				)
			);

			for (const i in IntegrationResponses) {
				const integrationResponse = IntegrationResponses[i];

				test(`${prefix} ${integrationResponse.StatusCode} status code - should have a blank integration response template`, () => assert
					.strictEqual(
						integrationResponse.ResponseTemplates['application/json'],
						'##',
						'Response template is not a one-line comment'
					)
				);

				const integrationResponseGET = cfnResources
					[`${resourceId}GET`]
					.Properties
					.Integration
					.IntegrationResponses[i];

				test(`${prefix} ${integrationResponse.StatusCode} status code - should match the GET method integration response (except the response template`, () => {
					for (const key in integrationResponse) {
						if (key === 'ResponseTemplates')
							continue;

						assert.deepStrictEqual(
							integrationResponse[key],
							integrationResponseGET[key]
						)
					}
				});
			}
			break;
		case 'GET':
			// TODO verify that there's a response model (not empty)
			break;
		case 'POST':
			// TODO verify that there's a request model
			break;
		case 'PUT':
			// TODO verify that there's a request model
			break;
		case 'PATCH':
			// TODO verify that there's a request model
			break;
		case 'DELETE':
			test(`${prefix} should have a 204 response`, () => assert.ok(
				IntegrationResponses.some(item => item.StatusCode === '204')
			));
			break;
	}
}

test('CloudFormation template should be a valid JSON file', () => assert
	.ok(jsonFile, 'not a valid JSON file')
);

test('CloudFormation template should be an object', () => assert
	.strictEqual(typeof jsonFile, 'object', 'not a valid JSON object')
);

test('CloudFormation template should contain a Resources object', () => assert
	.strictEqual(typeof jsonFile.Resources, 'object', 'not a valid JSON object')
);

const paths = {};
const cfnResources = jsonFile.Resources || {};
const apiResources = {};

for (const [key, value] of Object.entries(cfnResources)) {
	switch(value.Type) {
		case 'AWS::ApiGateway::Resource':
			const {Properties} = value;
			const {Ref} = Properties.ParentId;
			paths[key] = `${Ref ? `${paths[Ref]}/` : ''}${Properties.PathPart}`;
			break;
		case 'AWS::ApiGateway::Method':
			const resourceId = value.Properties.ResourceId.Ref;

			if (!apiResources[resourceId])
				apiResources[resourceId] = [];

			apiResources[resourceId].push(value.Properties.HttpMethod);

			test(`Method should have the correct ResourceId for ${key}`, () => assert
				.strictEqual(
					key,
					resourceId + value.Properties.HttpMethod,
					'ResourceId does not match correct value'
				)
			);
			break;
	}
}

Object.freeze(paths);

const requiredMethods = Object.freeze([
	'GET',
	'HEAD',
	'OPTIONS',
]);

for (const resourceId in apiResources) {
	const methods = apiResources[resourceId].sort();

	for (const method of requiredMethods) {
		test(`${resourceId} should contain a${/^O/.test(method) ? 'n' : ''} ${method} method`, () => {
			assert.ok(methods.includes(method), `${method} method not found`);
		});
	}

	for (const method of methods) {
		methodTests(cfnResources, resourceId, paths, methods, method);
	}
}
