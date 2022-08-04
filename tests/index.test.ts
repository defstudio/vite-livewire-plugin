/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import {afterEach, describe, expect, it, vi} from "vitest";
import livewire, {defaultWatches} from "../src";
import {HmrContext, HMRPayload, ViteDevServer} from "vite";

function fakeContext(file = ''): HmrContext {
    return {
        file: file,
        modules: [],
        read(): string | Promise<string> {
            return '';
        },
        server: {
            ws: {

                send: (payload: HMRPayload) => {
                    //.. do nothing
                }
            }
        } as ViteDevServer,
        timestamp: 0
    };
}

function freezeTime(date = new Date(2000, 1, 1, 13)): Date
{
    vi.setSystemTime(date);
    return date;
}

describe('configuration parse', () => {
    it('should handle missing configuration', () => {
        const plugin = livewire()
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual([]);
        expect(config.watch).toStrictEqual([
            '**/resources/views/**/*.blade.php',
            '**/app/**/Livewire/**/*.php',
            '**/app/**/Filament/**/*.php',
            'app/View/Components/**',
        ]);
    });

    it('should handle string configuration', function () {
        const plugin = livewire('foo')
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual([]);
        expect(config.watch).toStrictEqual(['foo']);
    });

    it('should handle array configuration', function () {
        const plugin = livewire(['foo', 'bar'])
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual([]);
        expect(config.watch).toStrictEqual(['foo', 'bar']);
    });

    it('should handle empty object configuration', function () {
        const plugin = livewire({})
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual([]);
        expect(config.watch).toStrictEqual([
            '**/resources/views/**/*.blade.php',
            '**/app/**/Livewire/**/*.php',
            '**/app/**/Filament/**/*.php',
            'app/View/Components/**',
        ]);
    });

    it('should handle object configuration with string watch', function () {
        const plugin = livewire({watch: 'foo'})
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual([]);
        expect(config.watch).toStrictEqual(['foo']);
    });

    it('should handle object configuration with array watch', function () {
        const plugin = livewire({watch: ['foo', 'bar']})
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual([]);
        expect(config.watch).toStrictEqual(['foo', 'bar']);
    });

    it('should handle object configuration with string refresh', function () {
        const plugin = livewire({refresh: 'foo'})
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual(['foo']);
        expect(config.watch).toStrictEqual([
            '**/resources/views/**/*.blade.php',
            '**/app/**/Livewire/**/*.php',
            '**/app/**/Filament/**/*.php',
            'app/View/Components/**',
        ]);
    });

    it('should handle object configuration with array refresh', function () {
        const plugin = livewire({refresh: ['foo', 'bar']})
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual(['foo', 'bar']);
        expect(config.watch).toStrictEqual([
            '**/resources/views/**/*.blade.php',
            '**/app/**/Livewire/**/*.php',
            '**/app/**/Filament/**/*.php',
            'app/View/Components/**',
        ]);
    });
});

describe('hot update handling', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    });

    it("should not trigger hot update if file doesn't match any pattern", function () {
        const plugin = livewire();

        plugin.handleHotUpdate?.(fakeContext());
    });

    it("should trigger hot update if file matches default class pattern", function () {
        const plugin = livewire();

        const context = fakeContext('/var/www/app/Html/Livewire/Test.php');
        const spy = vi.spyOn(context.server.ws, 'send');

        plugin.handleHotUpdate?.(context);

        expect(spy).toHaveBeenCalledWith({
            type: 'custom',
            event: 'livewire-update',
            data: {blade_updated: false},
        });
    });

    it("should not trigger hot updates when defaults watches are overridden", function () {
        const plugin = livewire({
            watch: 'var/www/app/modules/**/views/livewire/**/*.blade.php'
        });

        const context = fakeContext('/var/www/app/Html/Livewire/Test.php');
        const spy = vi.spyOn(context.server.ws, 'send');

        plugin.handleHotUpdate?.(context);
        expect(spy).toHaveBeenCalledTimes(0);

        context.file = 'var/www/app/modules/invoices/views/livewire/test.blade.php';
        plugin.handleHotUpdate?.(context);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should allow to add watch patterns to the default ones', function () {
        const plugin = livewire({
            watch: [
                ...defaultWatches,
                'var/www/app/modules/invoices/views/livewire/test.blade.php',
            ]
        });

        const context = fakeContext('/var/www/app/Html/Livewire/Test.php');
        const spy = vi.spyOn(context.server.ws, 'send');

        plugin.handleHotUpdate?.(context);
        expect(spy).toHaveBeenCalledWith({
            type: 'custom',
            event: 'livewire-update',
            data: {blade_updated: false},
        });

        context.file = 'var/www/app/modules/invoices/views/livewire/test.blade.php';
        plugin.handleHotUpdate?.(context);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenLastCalledWith({
            type: 'custom',
            event: 'livewire-update',
            data: {blade_updated: true},
        });
    });

    it("should not trigger css refresh by default if matches a file pattern", function () {
        const plugin = livewire();

        const context = fakeContext('/var/www/resources/views/test.blade.php');
        const spy = vi.spyOn(context.server.ws, 'send');

        plugin.handleHotUpdate?.(context);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should not trigger css refresh when set up and doesn't matches a file pattern", function () {
        const plugin = livewire({
            refresh: 'resources/css/app.css'
        });

        const context = fakeContext('/var/www/resources/components/test.blade.php');
        const spy = vi.spyOn(context.server.ws, 'send');

        plugin.handleHotUpdate?.(context);

        expect(spy).toHaveBeenCalledTimes(0);
    });

    it("should trigger css refresh when set up and matches a file pattern", function () {
        const plugin = livewire({
            refresh: 'resources/css/app.css'
        });

        const context = fakeContext('/var/www/resources/views/test.blade.php');
        const spy = vi.spyOn(context.server.ws, 'send');

        const time = freezeTime();

        plugin.handleHotUpdate?.(context);

        expect(spy).toHaveBeenCalledTimes(2);

        expect(spy).toHaveBeenCalledWith({
            type: 'update',
            updates: [
                {acceptedPath: "resources/css/app.css", path: "resources/css/app.css", timestamp: time.getTime(), type: 'css-update'}
            ],
        })
    });
});

