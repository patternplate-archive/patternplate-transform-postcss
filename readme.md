# patternplate-transform-postcss

[![Greenkeeper badge](https://badges.greenkeeper.io/sinnerschrader/patternplate-transform-postcss.svg)](https://greenkeeper.io/)
[patternplate](/sinnerschrader/patternplate) patternplate transform applying postcss to css sources

## Installation
```shell
npm install --save patternplate-transform-postcss postcss postcss-import
```

## Configuration
Install `patternplate-transform-postcss`, `postcss` and `postcss-import` in your [patternplate](/sinnerschrader/patternplate) project.
Then add the following configuration to `./configuration/patternplate-server`

```js
	// ./configuration/patternplate-server/transforms.js
	export default {
		postcss: {
			inFormat: 'css',
			outFormat: 'css',
			plugins: {...}
		}
	}
```

```js
	// ./configuration/patternplate-server/patterns.js
	export default {
		formats: {
			css: {
				transforms: ['postcss']
			}
		}
	}
```

## Plugins
The transform supports arbitrary `postcss` plugins.
To use a plugin you have to install it via `npm install --save ${pluginName}`.

To make the transform pick up the plugin you have to configure it - this is done by adding an object under `patternplate-server.transforms.postcss[${pluginName}]`. This will cause the transform to `require` and initialize the plugin.

```js
	// ./configuration/patternplate-server/transforms.js
	export default {
		postcss: {
			plugins: {
				pluginName: {...}
			}
		}
	}
```

Everything found in `patternplate-server.transforms.postcss[${pluginName}].options` will be passed directly.

Via the special order key you can determine the order of plugins during `postcss` initialization.
```js
	// ./configuration/patternplate-server/transforms.js
	export default {
		postcss: {
			plugins: {
				pluginName: { // e.g. postcss-import
					order: 1 // index of the plugin in postcss configuration, lower means earlier processing,
					options: { // plugin options
						foo: 'bar'
					}
				}
			}
		}
	}
```

## See also

* [patternplate](https://github.com/sinnerschrader/patternplate) - Create, show and deliver component libraries
* [transform-less](https://github.com/sinnerschrader/patternplate-transform-less) - Process LESS to CSS
* [transform-sass](https://github.com/sinnerschrader/patternplate-transform-sass) - Process SASS to CSS

---
Copyright 2016 by [SinnerSchrader Deutschland GmbH](https://github.com/sinnerschrader) and [contributors](./graphs/contributors). Released under the [MIT license]('./license.md').
