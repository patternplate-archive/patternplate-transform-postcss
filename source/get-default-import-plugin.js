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
		const loadedFile = find(pool, {path});
		const buffer = loadedFile ?
			loadedFile.source :
			(await readFile(path));

		const source = buffer instanceof Buffer ?
			buffer :
			new Buffer(buffer);

		return source.toString();
	},
	// either pattern.json dependency or available via npm
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

			// in dependencies, return path
			if (dependency) {
				return resolve(dependency.path);
			}

			// check if available in node_modules
			const available = resolveFrom.silent(process.cwd(), id);

			// in node_modules, return resolved path
			if (available) {
				return resolve(available);
			}

			// not available, throw
			const message = [
				`Could not find module "${id}", it is not in`,
				`${file.pattern.base}/pattern.json and could not be loaded from npm.`,
				`Available dependencies: ${deps.join(', ')}`
			];

			const err = new Error(message.join(' '));
			err.filename = file.path;

			reject(err);
		});
	}
});
