import {
    App,
    FileSystemAdapter,
    ItemView,
    KeymapEventHandler,
    KeymapEventListener,
    Modal,
    Modifier,
    Notice,
    Plugin,
    PluginManifest,
    PluginSettingTab,
    Scope,
    Setting,
    Vault,
    WorkspaceLeaf,
} from "obsidian";
import { ChroniclerSettings, settings } from "./settings";
import { If, Register, getUniqueArray, isNullOrWhitespace, zip } from "./Utils";
import { get, writable } from "svelte/store";
import { getContext, onDestroy, onMount, setContext } from "svelte";

export {
    onMount, onDestroy, writable, getContext, setContext, settings,
    App, FileSystemAdapter, Plugin, Scope, Vault, Modal, Notice, PluginSettingTab,
    ItemView, WorkspaceLeaf, Setting, zip, Register, isNullOrWhitespace, get, getUniqueArray, If,
};
export type {
    PluginManifest, KeymapEventHandler, Modifier,
    KeymapEventListener, ChroniclerSettings,
};



export const PluginRef = [
    'chronicler', 'kanban',
] as const;
export const selectors = [
    '.suggestion-container', 'promp-instructions', 'prompt-instruction',
    'prompt-instruction-command',
] as const;
export enum Keys {
    suggestion, global
}

export const globalContext = writable({
    taskIndex: 0,
});

export class Obsidian {
    basePath: string;
    vault: Vault;
    app: App;
    plugins: any;

    constructor(app: App) {
        this.basePath = (app.vault.adapter as FileSystemAdapter).getBasePath();
        this.vault = app.vault;
        this.app = app;
        this.plugins = (this.app as any).internalPlugins.app.plugins.plugins;
        console.log(`this.plugins`, this.plugins);
    }

    getPlugin<T = Plugin>(id: PluginId): T { return this.plugins[id] as T; }
    getSettings<PluginSettings = ChroniclerSettings>(id: PluginId): PluginSettings { return this.plugins[id].settings as PluginSettings; }
    getManifest(id: PluginId): PluginManifest { return this.plugins[id].manifest; }
}


export type Selectors = TFromArray<typeof selectors>;

export type PluginName = TFromArray<typeof PluginRef>;
export type PluginId = `obsidian-${PluginName}`;
export type GetPluginId<I extends PluginName> = `obsidian-${I}`;
export type PluginSettings = { [P in PluginName]: `${Capitalize<P>}Settings` };
export type GetPluginSettings<N extends PluginName> = `${Capitalize<N>}Settings`;
export type TFromArray<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer TFromArray> ? TFromArray : never;
export interface SuggestionCtx { app: App, plugin: Plugin, scope: Scope; editor: CodeMirror.Editor; }


export declare type KEY =
    'Alt' |
    'CapsLock' |
    'Control' |
    'Shift' |
    'Enter' |
    'Tab' |
    'ArrowDown' |
    'ArrowLeft' |
    'ArrowRight' |
    'ArrowUp' |
    'End' |
    'Home' |
    'PageDown' |
    'PageUp' |
    'Backspace' |
    'Escape' |

    'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' |
    'F8' | 'F9' | 'F10' | 'F11' | 'F12' | 'F13' | 'F14' |
    'F15' | 'F16' | 'F17' | 'F18' | 'F19' | 'F20' |

    'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' |
    'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' |
    'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' |
    'Y' | 'Z'
    ;

export declare type ObsidianEvent =
    'change' |
    'beforeChange' |
    'cursorActivity' |
    'beforeSelectionChange' |
    'delete' |
    'beforeCursorEnter' |
    'clear' |
    'hide' |
    'unhide' |
    'redraw' |
    'changes' |
    'keyHandled' |
    'inputRead' |
    'electricInput' |
    'viewportChange' |
    'swapDoc' |
    'gutterClick' |
    'gutterContextMenu' |
    'focus' |
    'blur' |
    'scroll' |
    'refresh' |
    'optionChange' |
    'scrollCursorIntoView' |
    'update' |
    'renderLine' |
    'overwriteToggle'
    ;

export type CM_Mod = 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey';
export const CM_Map: Record<Exclude<Modifier, 'Mod'>, CM_Mod> = {
    'Alt': 'altKey',
    'Ctrl': 'ctrlKey',
    'Meta': 'metaKey',
    'Shift': 'shiftKey'
} as const;
