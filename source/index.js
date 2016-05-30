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
		file.buffer = result.css;
		return file;
	};
};
