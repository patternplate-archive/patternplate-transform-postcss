import {resolve} from 'try-require';
import {debuglog as createDebugLog} from 'util';

const debuglog = createDebugLog('postcss');

function resolveable(name) {
	if (!resolve(name)) {
		throw new Error(`postcss plugin "${name}" is configured but could not be resolved. Is "${name}" installed?`);
	}
	return name;
}

export default configuration =>
	Object.entries(configuration.plugins || {})
		.sort((a, b) => a[1].order - b[1].order)
		.filter(entry => {
			const [name] = entry;
			return resolveable(name);
		})
		.reduce((registry, entry, index) => {
			const [name, {options = {}}] = entry;
			const plugin = require(name);
			debuglog(`Loading postcss plugin ${name} on index ${index} with config:`);
			debuglog(options);
			return [
				...registry,
				plugin(options)
			];
		}, []);
