import uuidParse from 'uuid-parse';
import {toBase64Safe} from '../_helpers';

function hexChar() {
	return Math.floor(Math.random() * 16).toString(16);
}

export function uuid() {
	return [2, 1, 1, 1, 3]
		.map(n => new Array(n)
			.fill()
			.map(() => hexChar().repeat(4))
			.join('')
		)
		.join('-');
}

export function uuidBase64Safe() {
	return toBase64Safe(
		uuidParse.parse(uuid(), Buffer.alloc(16)).toString('base64')
	);
}

export function cognitoId() {
	return `us-east-1:${uuid()}`;
}

export function intFromRange(min, max) {
	return min + Math.floor(Math.random() * (max - min));
}

export function time(start = 2000, end = 2010) {
	return intFromRange(
		...[start, end]
			.map(year => new Date(`${year}-01-01T00:00:00.000Z`).getTime())
	);
}

function char() {
	return String.fromCharCode(97 + Math.floor(Math.random() * 26));
}

function stringCase(str) {
	return Math.round(Math.random()) ? str : str.toUpperCase()
}

export function word(min = 3, max = 5) {
	return new Array(intFromRange(min, max))
		.fill()
		.map(char)
		.map(stringCase)
		.join('');
}

export function words(min = 3, max = 7) {
	return new Array(intFromRange(min, max))
		.fill()
		.map(word)
		.join(' ');
}

export function boolean() {
	return !Math.round(Math.random());
}

export function username() {
	return word(3, 20).toLowerCase();
}

export function name() {
	return words(2, 2);
}

export function email() {
	return `${word()}@${word()}.${word(2, 3)}`.toLowerCase();
}

export function sha256() {
	return new Array(16)
		.fill()
		.map(() => hexChar().repeat(4))
		.join('');
}