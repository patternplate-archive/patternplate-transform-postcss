import resolveNodeback from 'resolve';
import {debuglog as createDebugLog} from 'util';

const debuglog = createDebugLog('postcss');
const basedir = process.cwd();

function resolve(name, options) {
	return new Promise((done, reject) => {
		resolveNodeback(name, options, (error, result) => {
			if (error) {
				reject(error);
			}
			done(result);
		});
	});
}

async function resolveable(name) {
	try {
		return await resolve(name, {basedir});
	} catch (error) {
		throw new Error(`postcss plugin "${name}" is configured but could not be resolved. Is "${name}" installed?`);
	}
}

export default async configuration => {
	const entries = Object.entries(configuration.plugins || {});

	const resolved = await Promise.all(entries
		.sort((a, b) => a[1].order - b[1].order)
		.map(async entry => {
			const [name, configuration] = entry;
			const resolved = await resolveable(name);
			return {
				name,
				resolved,
				configuration
			};
		}));

	return resolved.reduce((registry, entry, index) => {
		const {name, resolved, configuration: {options}} = entry;
		const plugin = require(resolved);
		debuglog(`Loading postcss plugin ${name} on index ${index} with config:`);
		debuglog(options);
		return [
			...registry,
			plugin(options)
		];
	}, []);
};
