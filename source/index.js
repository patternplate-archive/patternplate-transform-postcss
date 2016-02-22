import {dirname} from 'path';
import {
	readFile as readFileNodeback
} from 'fs';

import denodeify from 'denodeify';
import {find, merge} from 'lodash';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import {resolve} from 'try-require';

import defaults from './defaults';
import flattenDependencies from './flatten-dependencies';
import getPlugins from './get-plugins';

const readFile = denodeify(readFileNodeback);

export default () => {
	return async (file, _, configuration) => {
		// Merge defaults with user-supplied configuration
		const settings = merge({}, defaults, configuration);
		const pool = [file, ...flattenDependencies(file)];

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
				// either pattern.json dependency or available via npm
				resolve(id, baseDir) {
					const baseName = id === 'Pattern' ?
						'demo' : 'index';

					const baseFile = find(pool, item => {
						const {path, basename} = item;
						return dirname(path) === baseDir &&
							basename === baseName;
					}) || {};

					const {dependencies} = baseFile;
					const dependency = dependencies[id];

					// in dependencies, return path
					if (dependency) {
						return dependency.path;
					}

					// check if available in node_modules
					const available = resolve(id);

					// in node_modules, return resolved path
					if (available) {
						return available;
					}

					// not available, throw
					if (available === false) {
						const message = [
							`Could not find module "${id}", it is not in "${baseFile}'s"`,
							`pattern.json and could not be loaded from npm.`,
							`Available dependencies: ${Object.keys(dependencies).join(', ')}`
						];
						throw new Error(message);
					}
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
