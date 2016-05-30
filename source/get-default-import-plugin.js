import {readFile as readFileNodeback} from 'fs';
import {dirname} from 'path';

import denodeify from 'denodeify';
import {find} from 'lodash';
import postcssImport from 'postcss-import';
import {resolve} from 'try-require';

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
});
