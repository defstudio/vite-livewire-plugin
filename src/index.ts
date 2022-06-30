import {ConfigEnv, Plugin, PluginOption, UpdatePayload, UserConfig} from "vite";

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
