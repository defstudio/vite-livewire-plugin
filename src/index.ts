import {HmrContext, PluginOption} from "vite";
import {Update} from "vite/types/hmrPayload";

import minimatch from 'minimatch';

interface PluginConfig {
    refresh?: string | string[];
    watch?: string | string[];
}

function refresh(ctx: HmrContext, config?: PluginConfig): void {
    let refresh = config?.refresh;

    if (refresh) {
        if (!Array.isArray(refresh)) {
            refresh = [refresh];
        }

        const updates = [];
        for (const path of refresh) {
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

        ctx.server.ws.send({
            type: 'update',
            updates: updates,
        });
    }

    ctx.server.ws.send({
        type: 'custom',
        event: 'livewire-update',
        data: {
            blade_updated: ctx.file.endsWith('.blade.php'),
        }
    });
}


export default function livewire(config?: PluginConfig): PluginOption {
    const typoVirtualModuleId = 'virtual:tailwind-hot-reload'

    const virtualModuleId = 'virtual:livewire-hot-reload'
    const resolvedVirtualModuleId = '\0' + virtualModuleId

    return {
        name: 'Tailwind Plugin',
        resolveId(id) {
            if (id === virtualModuleId || id === typoVirtualModuleId) {
                return resolvedVirtualModuleId
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                return `
                    let lastLivewireUpdate = 0;

                    function initConflictingReloadCheck()
                    {
                          window.onload = function() {
                              if( sessionStorage.getItem("livewire_hot_reload_conflict") === '1'){
                                  console.error("" +
                                   "[vite] Another Vite plugin reloaded the page whilst defstudio/vite-livewire-plugin was refreshing a Livewire component. For optimal results, disable full page reloads when defstudio/vite-livewire-plugin is enabled. For more info, visit out docs: https://github.com/def-studio/vite-livewire-plugin");
                              }

                              sessionStorage.setItem("livewire_hot_reload_conflict", '0');

                              window.addEventListener("beforeunload", function (event) {
                                const now = (new Date()).getTime();

                                if(now - lastLivewireUpdate > 200){
                                    return;
                                }

                                sessionStorage.setItem("livewire_hot_reload_conflict", '1');
                            });
                          };
                    }

                    function makeOptInCheckbox()
                    {
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.style.cssText = "width: 12px; height: 12px; cursor: pointer";
                        checkbox.id = "livewire_hot_reload";
                        checkbox.checked = sessionStorage.getItem("livewire_hot_reload") === "1";

                        sessionStorage.setItem("livewire_hot_reload", checkbox.checked ? "1" : "0");
                        console.log("[vite] livewire hot reload " + (checkbox.checked ? "enabled." : "disabled."));

                        checkbox.addEventListener('change', event => {
                            const eventTarget = event.currentTarget;
                            if (eventTarget === null) {
                                return;
                            }
                            if (eventTarget instanceof HTMLInputElement) {
                                sessionStorage.setItem("livewire_hot_reload", eventTarget.checked ? "1" : "0");
                            }

                             console.log("[vite] livewire hot reload " + (eventTarget.checked ? "enabled." : "disabled."));
                        });

                        return checkbox;
                    }

                    function makeOptInLabel()
                    {
                        const label = document.createElement('label');
                        label.style.cssText = "position: fixed; bottom: 10px; right: 10px; font-size: 12px; cursor: pointer";
                        label.innerHTML += "Livewire Hot Reload&nbsp;";

                        return label;
                    }

                    function injectOptInCheckbox()
                    {
                       const label = makeOptInLabel();
                       label.append(makeOptInCheckbox());
                       window.document.body.insertBefore(label, window.document.body.lastChild);
                    }

                    export function livewire_hot_reload() {

                        if (import.meta.hot) {
                            initConflictingReloadCheck();

                            if(import.meta.env.VITE_LIVEWIRE_OPT_IN){
                                injectOptInCheckbox();
                            }else{
                                 console.log("[vite] livewire hot reload enabled.");
                            }

                            import.meta.hot.on('livewire-update', data => {
                                if (typeof Livewire === "undefined" || Object.keys(Livewire.components).length === 0) {
                                    console.log("[vite] full reload...");
                                    location.reload();
                                    return;
                                }
                                const checkbox = window.document.getElementById("livewire_hot_reload");

                                if (checkbox && !checkbox.checked) {
                                    if(!data.blade_updated){
                                        return;
                                    }

                                    console.log('[vite] full reload...');
                                    location.reload();

                                    return;
                                }

                                for (const componentId in Livewire.components.componentsById) {
                                    const component = Livewire.components.componentsById[componentId];
                                    component.call('$refresh');
                                }

                                lastLivewireUpdate = (new Date()).getTime();
                                console.log('[vite] livewire hot updated.');
                            });
                        }
                    }
                `
            }
        },
        handleHotUpdate(ctx) {

            let watch = config?.watch ?? [
                '**/resources/views/**/*.blade.php',
                '**/app/**/Livewire/**/*.php'
            ];

            if (!Array.isArray(watch)) {
                watch = [watch];
            }

            for (const pattern of watch) {
                if (minimatch(ctx.file, pattern)) {
                    refresh(ctx, config)
                }
            }
        }
    }
}
