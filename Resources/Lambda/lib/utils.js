export function binaryToBase64Safe(value) {
	return value
		.toString('base64')
		.replace(/=+$/, '')
		.replace(/[+/]/g, c => c === '+' ? '-' : '_');
}

export function base64SafeToBinary(value) {
	return Buffer.from(
		value.replace(/[-_]/g, c => c === '-' ? '+' : '/') + '==',
		'base64'
	);
}
