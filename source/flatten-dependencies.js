export default function flatteDependencies(file) {
	return [
		...new Set(
			Object.values(file.dependencies)
				.reduce((pool, dependency) => {
					return [
						...pool,
						dependency,
						...flatteDependencies(dependency)
					];
				}, [])
		)
	];
}
