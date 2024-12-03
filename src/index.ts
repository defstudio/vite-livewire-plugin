// noinspection JSUnusedLocalSymbols

import {HmrContext, Plugin} from "vite";
import {Update} from "vite/types/hmrPayload";

import {minimatch} from 'minimatch';

interface PluginConfig {
    refresh?: string | string[];
    watch?: string | string[];
    bottomPosition?: number;
}

interface ResolvedPluginConfig extends PluginConfig {
    refresh: string[];
    watch: string[];
    bottomPosition: number;
}

interface LivewirePlugin extends Plugin {
    readonly pluginConfig: PluginConfig;
}

export const defaultWatches: string[] = [
    '**/resources/views/**/*.blade.php',
    '**/app/**/Livewire/**/*.php',
    '**/app/**/Filament/**/*.php',
    'app/View/Components/**',
];

export const defaultConfig: PluginConfig = {
    watch: defaultWatches,
    refresh: [],
    bottomPosition: 10,
}

function triggerUpdates(ctx: HmrContext, refreshList: string[]): void {
    const updates = [];
    for (const path of refreshList) {
        let type;
        if (path.endsWith('css')) {
            type = 'css-update';
        } else if (path.endsWith('js')) {
            type = 'js-update';
        } else {
            continue;
        }

        updates.push({
            type: type,
            path: path,
            acceptedPath: path,
            timestamp: (new Date).getTime(),
        } as Update)
    }

    if (updates.length > 0) {
        ctx.server.ws.send({
            type: 'update',
            updates: updates,
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function refresh(ctx: HmrContext, config: ResolvedPluginConfig): void {
    ctx.server.ws.send({
        type: 'custom',
        event: 'livewire-update',
        data: {
            blade_updated: ctx.file.endsWith('.blade.php'),
        }
    });
}

function resolvePluginConfig(config?: PluginConfig | string | string[]): ResolvedPluginConfig {
    if (typeof config === 'undefined') {
        config = defaultConfig;
    }

    if (typeof config === 'string') {
        config = [config];
    }

    if (Array.isArray(config)) {
        const watch = config;
        config = {...defaultConfig};
        config.watch = watch;
    }

    if (typeof config.refresh === 'undefined') {
        config.refresh = defaultConfig.refresh;
    }

    if (typeof config.refresh === 'string') {
        config.refresh = [config.refresh];
    }

    if (typeof config.watch === 'undefined') {
        config.watch = defaultConfig.watch;
    }

    if (typeof config.watch === 'string') {
        config.watch = [config.watch];
    }

    if (typeof config.bottomPosition === 'undefined') {
        config.bottomPosition = defaultConfig.bottomPosition;
    }

    return config as ResolvedPluginConfig;
}

export default function livewire(config?: PluginConfig | string | string[]): LivewirePlugin {
    // There was a typo in first release of this package
    // this const is left for backward compatibility with
    // previous setups.
    const typoVirtualModuleId = 'virtual:tailwind-hot-reload'

    const virtualModuleId = 'virtual:livewire-hot-reload'
    const resolvedVirtualModuleId = '\0' + virtualModuleId

    const pluginConfig = resolvePluginConfig(config);

    return {
        name: 'Tailwind Plugin',
        pluginConfig: pluginConfig,
        resolveId(id) {
            if (id === virtualModuleId || id === typoVirtualModuleId) {
                return resolvedVirtualModuleId
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {

                //language=javascript ← automatic language injection for phpstorm
                return `
                    let lastLivewireUpdate = 0;

                    function initConflictingReloadCheck() {
                        window.onload = function () {
                            if (sessionStorage.getItem("livewire_hot_reload_conflict") === '1') {
                                console.error("" +
                                    "[vite] Another Vite plugin reloaded the page whilst " +
                                    "defstudio/vite-livewire-plugin was refreshing a Livewire component. " +
                                    "For optimal results, disable full page reloads when " +
                                    "defstudio/vite-livewire-plugin is enabled. " +
                                    "For more info, visit out docs: https://github.com/def-studio/vite-livewire-plugin");
                            }

                            sessionStorage.setItem("livewire_hot_reload_conflict", '0');

                            window.addEventListener("beforeunload", () => {
                                const now = (new Date()).getTime();

                                if (now - lastLivewireUpdate > 200) {
                                    return;
                                }

                                sessionStorage.setItem("livewire_hot_reload_conflict", '1');
                            });
                        };
                    }

                    function makeOptInCheckbox() {
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.style.cssText = "width: 12px; height: 12px; cursor: pointer";
                        checkbox.id = "livewire_hot_reload";
                        checkbox.checked = (sessionStorage.getItem("livewire_hot_reload") ?? "1") === "1";

                        sessionStorage.setItem("livewire_hot_reload", checkbox.checked ? "1" : "0");
                        console.log("[vite] livewire hot reload " + (checkbox.checked ? "enabled." : "disabled."));

                        checkbox.addEventListener('change', event => {
                            const eventTarget = event.currentTarget;
                            if (eventTarget === null) {
                                return;
                            }
                            if (eventTarget instanceof HTMLInputElement) {
                                sessionStorage.setItem("livewire_hot_reload", eventTarget.checked ? "1" : "0");
                                console.log("[vite] livewire hot reload " + (eventTarget.checked ? "enabled." : "disabled."));
                            }


                        });

                        return checkbox;
                    }

                    function makeOptInLabel() {
                        const debugbarHeight = document.querySelector('.phpdebugbar, .clockwork-toolbar, .sf-toolbar')?.offsetHeight ?? 0;
                        const defaultBottomPosition = ${pluginConfig.bottomPosition};
                        const calculatedBottomPosition = debugbarHeight + defaultBottomPosition
                        const label = document.createElement('label');
                        label.style.cssText = "position: fixed; bottom: "+calculatedBottomPosition+"px; right: 10px; font-size: 12px; cursor: pointer";
                        label.innerHTML += "Livewire Hot Reload&nbsp;";

                        return label;
                    }

                    function injectOptInCheckbox() {
                        const label = makeOptInLabel();
                        // noinspection JSCheckFunctionSignatures
                        label.append(makeOptInCheckbox());
                        window.document.body.insertBefore(label, window.document.body.lastChild);
                    }

                    export function livewire_hot_reload() {

                        if (import.meta.hot) {
                            initConflictingReloadCheck();

                            if (import.meta.env.VITE_LIVEWIRE_OPT_IN) {
                                injectOptInCheckbox();
                            } else {
                                console.log("[vite] livewire hot reload enabled.");
                            }

                            import.meta.hot.on('livewire-update', data => {
                                // noinspection JSUnresolvedVariable
                                if (typeof Livewire === "undefined" || (Livewire.components !== undefined && Object.keys(Livewire.components).length === 0) || (Livewire.components === undefined && Object.keys(Livewire.all()).length === 0)) {
                                    console.log("[vite] full reload...");
                                    location.reload();
                                    return;
                                }
                                const checkbox = window.document.getElementById("livewire_hot_reload");

                                if (checkbox && !checkbox.checked) {
                                    if (!data.blade_updated) {
                                        return;
                                    }

                                    console.log('[vite] full reload...');
                                    location.reload();

                                    return;
                                }

                                if(Livewire.components === undefined){
                                    Livewire.all().forEach(component => component.$wire.call('$refresh'));
                                }else{
                                    for (const componentId in Livewire.components.componentsById) {
                                        const component = Livewire.components.componentsById[componentId];
                                        component.call('$refresh');
                                    }
                                }


                                lastLivewireUpdate = (new Date()).getTime();
                                console.log('[vite] livewire hot updated.');
                            });
                        }
                    }
                `;
            }
        },
        handleHotUpdate(ctx) {

            if (minimatch(ctx.file, '**/storage/framework/views/**/*.php')) {
                return [];
            }

            for (const pattern of pluginConfig.watch) {
                if (minimatch(ctx.file, pattern)) {
                    const refreshList = [...pluginConfig.refresh.filter(path => {
                        if(ctx.modules.length === 0 || !ctx.modules[0]){
                            return true
                        }

                        let includeInRefresh = true;
                        ctx.modules[0].importers.forEach(importer => {
                            includeInRefresh = !importer.file?.endsWith(path) ?? false;
                        });
                        return includeInRefresh;
                    })];

                    triggerUpdates(ctx, refreshList);
                    refresh(ctx, pluginConfig)

                    return [...ctx.modules[0]?.importers ?? [], ...ctx.modules.slice(1)];
                }
            }
        }
    }
}
