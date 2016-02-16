import {
	dirname
} from 'path';
import {
	readFile as readFileNodeback
} from 'fs';

import denodeify from 'denodeify';
import {
	find,
	merge
} from 'lodash';
import postcss from 'postcss';
import postcssImport from 'postcss-import';

import defaults from './defaults';
import flattenDependencies from './flatten-dependencies';
import getPlugins from './get-plugins';

const readFile = denodeify(readFileNodeback);

export default () => {
	return async (file, _, configuration) => {
		// Merge defaults with user-supplied configuration
		const settings = merge({}, defaults, configuration);
		const pool = flattenDependencies(file);

		// Assemble plugin configuration
		const plugins = [
			postcssImport({
				// Use dependency file buffer or load from npm
				async load(path) {
					const loadedFile = find(pool, {path});
					if (loadedFile) {
						return loadedFile.buffer.toString('utf-8');
					}
					const buffer = await readFile(path);
					return buffer.toString('utf-8');
				},
				// eiter pattern.json dependency or available via npm
				resolve(id, baseDir) {
					const baseFile = find(pool, item => dirname(item.path) === baseDir) || {};
					if ((id in baseFile.dependencies) === false) {
						return require.resolve(id);
					}
					return baseFile.dependencies[id].path;
				}
			}),
			...getPlugins(settings)
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
