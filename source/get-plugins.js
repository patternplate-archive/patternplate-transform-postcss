export default configuration =>
	Object.entries(configuration.plugins || {})
		.filter((a, b) => b[1].order - a[1].order)
		.reduce((registry, entry) => {
			const [name, options] = entry;
			const plugin = require(name);
			return [
				...registry,
				plugin(options)
			];
		}, []);
