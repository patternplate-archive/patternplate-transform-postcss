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

		// apply postcss
		const source = file.buffer.toString('utf-8');

		const result = await processor.process(source, {
			from: file.path
		});

		const [problem] = (result.messages || [])
			.filter(message => isImportError(message) || isError(message));

		if (problem) {
			const error = new Error([
				problem.text,
				codeFrame(source, problem.line, problem.column)
			].join('\n'));
			error.filename = file.path;

			error.line = problem.line;
			error.column = problem.column;

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
	return message.type === 'warning' && message.text.indexOf('Could not find module') === 0;
}
