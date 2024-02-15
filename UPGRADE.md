# Upgrade Guide

## `1.x` to `2.x`

This release adds support for Vite 5 and removes support for Vite 3 and 4.

### Notable Changes

1. Dropped support for CJS

### Upgrade Path

1. Update to the latest version of the `laravel-vite-plugin`, `vite`, `vite-livewire-plugin`, and any Vite plugins you may have installed.

The following command will update `vite-livewire-plugin`, `laravel-vite-plugin` and `vite` only:

```
npm install vite@^5.0.0 laravel-vite-plugin@^1.x @defstudio/vite-livewire-plugin@^2.x
```

You should also check the upgrade guide and changelogs for any packages you update. The [`vite` migrations guide](https://vitejs.dev/guide/migration.html) is available on their website.

2. Ensure your `package.json` contains `"type": "module"`.

Run the following command in your project's root directory or anywhere you have your `package.json` files:

```sh
npm pkg set type=module
```

You may also need to rename any `*.js` configuration files that contain CJS, which is the older-style Node-flavored `var plugin = require('plugin')` syntax, to `filename.cjs` after making this change.
