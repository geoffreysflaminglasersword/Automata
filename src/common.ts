import * as RX from 'Regex';

import { App, FileSystemAdapter, Plugin, PluginManifest, Vault, Workspace } from "obsidian";
import { File, If, Register, getUniqueArray, isNullOrWhitespace, wrap, zip } from "./Utils";
import type { Instantce, Options } from "./Utils";
import { ItemView, KeymapEventHandler, KeymapEventListener, Modal, Modifier, } from "obsidian";
import { Notice, PluginSettingTab, Scope, Setting, WorkspaceLeaf } from "obsidian";
import { Writable, get, writable } from "svelte/store";
import { getContext, onDestroy, onMount, setContext } from "svelte";

import { ChroniclerSettings } from "settings";
import { G_CTX } from "./globalContext";
import { regexIndexOf } from 'Regex';
import { settings } from "settings";

export {
    onMount, onDestroy, writable, getContext, setContext, settings,
    App, FileSystemAdapter, Plugin, Scope, Vault, Modal, Notice, PluginSettingTab,
    ItemView, WorkspaceLeaf, Setting, zip, Register, isNullOrWhitespace, get,
    getUniqueArray, If, RX, regexIndexOf, wrap, Workspace, G_CTX, File
};

export type {
    PluginManifest, KeymapEventHandler, Modifier,
    KeymapEventListener, ChroniclerSettings,
    Options, Instantce,
};



export const PluginRef = [
    'chronicler',
    'kanban',
] as const;



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




export type PluginName = TFromArray<typeof PluginRef>;
export type PluginId = `obsidian-${PluginName}`;
export type GetPluginId<I extends PluginName> = `obsidian-${I}`;
export type PluginSettings = { [P in PluginName]: `${Capitalize<P>}Settings` };
export type GetPluginSettings<N extends PluginName> = `${Capitalize<N>}Settings`;
export type TFromArray<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer TFromArray> ? TFromArray : never;





