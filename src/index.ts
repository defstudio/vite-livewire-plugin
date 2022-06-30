// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {ConfigEnv, Plugin, PluginOption, UserConfig} from "vite";

interface PluginConfig {
    refresh?: string | string[];
}

interface LivewirePlugin extends Plugin {
    config: (config: UserConfig, env: ConfigEnv) => UserConfig
}

export default function livewire(config: PluginConfig): PluginOption {
    return {
        name: 'blade',
        handleHotUpdate(ctx) {
            if (ctx.file.endsWith('.blade.php')) {
                ctx.server.ws.send({
                    type: 'update',
                    updates: [{
                        type: 'css-update',
                        path: 'resources/css/app.css',
                        acceptedPath: 'resources/css/app.css',
                        timestamp: (new Date).getTime()
                    }],
                });
                ctx.server.ws.send({
                    type: 'custom',
                    event: 'livewire-update',
                });
            }
        }
    }
}

export function livewire_hot_reload(): void
{

    // @ts-ignore
    if(import.meta.hot){
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.cssText = "width: 12px; height: 12px; cursor: pointer"
        checkbox.id = "livewire_hot_reload";
        checkbox.checked = sessionStorage.getItem("livewire_hot_reload") === "1";
        sessionStorage.setItem("livewire_hot_reload", checkbox.checked ? "1" : "0");


        checkbox.addEventListener('change', event => {
            // @ts-ignore
            sessionStorage.setItem("livewire_hot_reload", event.currentTarget.checked  ? "1" : "0")
        });


        const label = document.createElement('label');
        label.style.cssText = "position: fixed; bottom: 10px; right: 10px; font-size: 12px; cursor: pointer";
        label.innerHTML += "Enable Livewire Sync&nbsp;"
        label.append(checkbox)


        window.document.body.insertBefore(label, window.document.body.lastChild);

        // @ts-ignore
        import.meta.hot.on('livewire-update', data => {
            // @ts-ignore
            if(typeof Livewire === "undefined" || Object.keys(Livewire.components).length === 0){
                console.log("[vite] full reload");
                location.reload();
                return
            }

            // @ts-ignore
            if(!window.document.getElementById("livewire_hot_reload").checked){
                console.log('[vite] full reload');
                location.reload();
                return
            }

            console.log('[vite] livewire hot updated');
            // @ts-ignore
            for (const componentId in Livewire.components.componentsById) {
                // @ts-ignore
                const component = Livewire.components.componentsById[componentId];
                component.call('$refresh');
            }
        });
    }
}
