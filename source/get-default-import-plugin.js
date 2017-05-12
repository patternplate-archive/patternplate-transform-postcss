import {readFile as readFileNodeback} from 'fs';
import path from 'path';

import denodeify from 'denodeify';
import {find} from 'lodash';
import postcssImport from 'postcss-import';
import resolveFrom from 'resolve-from';

const readFile = denodeify(readFileNodeback);

export default pool => postcssImport({
	// Use dependency file buffer or load from npm
	async load(path) {
		const file = find(pool, {path});
		const source = file ?
			String(file.source) :
			await readFile(path, 'utf-8');

		const id = file ? file.pattern.id : '';
		return `/* ${id} */\n${source}`;
	},
	// Either pattern.json dependency or available via npm
	resolve(id, baseDir) {
		return new Promise((resolve, reject) => {
			const baseName = id === 'Pattern' ?
				'demo' : 'index';

			const file = find(pool, item => {
				return path.dirname(item.path) === baseDir && item.basename === baseName;
			}) || {};

			const {dependencies} = file;

			const deps = Object.keys(dependencies);
			const dependency = dependencies[id];

			// In dependencies, return path
			if (dependency) {
				return resolve(dependency.path);
			}

			// Check if available in node_modules
			const available = resolveFrom.silent(process.cwd(), id);

			// In node_modules, return resolved path
			if (available) {
				return resolve(available);
			}

			// Not available, throw
			const message = [
				`Could not find module "${id}", it is not specified in`,
				`${file.pattern.id}/pattern.json and could not be loaded from npm.`,
				`Available dependencies: ${deps.join(', ')}`
			];

			const err = new Error(message.join(' '));
			err.filename = file.path;

			reject(err);
		});
	}
});
