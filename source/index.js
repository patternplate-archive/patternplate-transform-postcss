import codeFrame from 'babel-code-frame';
import {merge} from 'lodash';
import postcss from 'postcss';

import defaults from './defaults';
import flattenDependencies from './flatten-dependencies';
import getDefaultImportPlugin from './get-default-import-plugin';
import getPlugins from './get-plugins';

export default () => {
	return async (file, _, configuration) => {
		// Merge defaults with user-supplied configuration
		const settings = merge({}, defaults, configuration);
		const pool = [file, ...flattenDependencies(file)];

		// Assemble plugin configuration
		const plugins = [
			getDefaultImportPlugin(pool),
			...(await getPlugins(settings))
		];

		// Instatiate postcss with plugins
		const processor = postcss(plugins);

		// Apply postcss
		const source = file.buffer.toString('utf-8');

		const result = await processor.process(source, {
			from: file.path
		});

		const [problem] = (result.messages || [])
			.filter(message => isImportError(message) || isError(message));

		if (problem) {
			const frame = getCodeFrame(problem);
			const error = new Error([problem.text, frame].filter(Boolean).join('\n'));
			throw error;
		}

		file.buffer = result.css;
		return file;
	};
};

function isError(message) {
	return message.type === 'error';
}

function isImportError(message) {
	return message.type === 'warning' && message.plugin === 'postcss-import';
}

function getCodeFrame(problem) {
	if (typeof problem !== 'object') {
		return null;
	}

	const {line, column} = problem;

	if (typeof line !== 'number' || typeof column !== 'number') {
		return null;
	}

	const input = getInput(problem);

	if (typeof input !== 'object') {
		return null;
	}

	const {css, file} = input;

	if (typeof css !== 'string') {
		return null;
	}

	return [
		file,
		codeFrame(css, line, column)
	].join('\n');
}

function getInput(problem) {
	const {node} = problem;

	if (typeof node !== 'object') {
		return null;
	}

	const {source} = node;

	if (typeof source !== 'object') {
		return null;
	}

	const {input} = source;

	return input;
}
