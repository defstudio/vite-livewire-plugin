import {describe, expect, it} from "vitest";
import livewire from "../src";

describe('vite livewire plugin', () => {

    it('should handle missing configuration', () => {
        const plugin = livewire()
        const config = plugin.pluginConfig;

        expect(config.refresh).toStrictEqual([]);
        expect(config.watch).toStrictEqual([
            '**/resources/views/**/*.blade.php',
            '**/app/**/Livewire/**/*.php',
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
});
