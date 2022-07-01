

## installation

```bash
npm install --save-dev @defstudio/vite-livewire-plugin
```

## usage

Livewire hot reload can be enabled by adding the `livewire()` plugin to the `vite.config.js` file:

```js
import {defineConfig} from 'vite';
import laravel from 'laravel-vite-plugin';

import livewire from '@defstudio/vite-livewire-plugin'; // <-- import

export default defineConfig({
    //...
    
    plugins: [
        laravel([
            'resources/css/app.css',
            'resources/js/app.js',
        ]),
        
       livewire({  // <-- add livewire plugin
           refresh: ['resources/css/app.css'],
       }),
    ],
});
```

and add the livewire hot reload manager in your `app.js` file:

```js
//..

import { livewire_hot_reload } from 'virtual:tailwind-hot-reload'
livewire_hot_reload();
```

After the Vite server is started, you should see the init message on your browser console:

```
[vite] connecting...
[vite] livewire hot reload ready.
[vite] connected.
```

From now on, when a `.blade.php` or Livewire `.php` class is updated, the hot reload will trigger a refresh for all Livewire components in page (and the app.css file as well):

```
[vite] css hot updated: /resources/css/app.css
[vite] livewire hot updated.
```

### Watching files for hot reload trigger

by default `livewire()` plugin will trigger hot reload when a `.blade.php` file changes in `resources/view/**` folders or a  `.php` file changes in `app/**/Livewire/**` folders.

if you wish to change this behaviuor (because you have lviewire files in other locations), this can be achieved using the `watch` config:

```js
// vite.config.js 

export default defineConfig({
    //...
    
    plugins: [
        laravel([
            'resources/css/app.css',
            'resources/js/app.js',
        ]),
        
       livewire({
           refresh: ['resources/css/app.css'],
           watch: [
               '**/resources/views/**/*.blade.php',
               '**/app/**/Livewire/**/*.php',
               '**/domains/**/Livewire/**/*.php',
           ]
       }),
    ],
});
```

## important!

this Vite plugin, because of Livewire design, is not compatible with other plugins that refresh the page when a `.blade.php` file changes (i.e. laravel/vite-plugin with blade option active)
