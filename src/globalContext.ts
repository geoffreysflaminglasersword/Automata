import { App, File, FileSystemAdapter, Plugin, PluginId, PluginManifest, Vault, Workspace } from "common";
import { ApplicabilityVisitor, CreationVisitor } from "./Visitor";
import { CompositeContext, Context, FileContext } from "./Context";
import { Invalidator, MemberStoreType, SubscribableKeys, UpdatableKeys, WritablePropertize } from "./Utils";
import { Subscriber, Writable, get, writable } from "svelte/store";

import { ChroniclerSettings } from "settings";
import CodeMirror from "codemirror";
import { TFile } from "obsidian";

// export const globalContext = writable({
//     taskIndex: 0,
//     currentEditor: <CodeMirror.Editor>null,
// });
interface ObsidianCommon { app: App; vault: Vault; workspace: Workspace; editor: CodeMirror.Editor; }
;
type PrivateStoredProps = WritablePropertize<ObsidianCommon>;
// type PrivateStoredPropKeys = keyof PrivateStoredProps;
// export interface Obsidian extends Omit<_Obsidian, PrivateStoredPropKeys> { }
class GlobalContext extends CompositeContext implements PrivateStoredProps {
    contextMap = new Map<string, Context>([
        ['Test', new FileContext('task/', 'jeff/')]
    ]);

    basePath: string;
    plugins: any;
    plugin: Plugin;

    currentFile: TFile;
    activeContexts: string[] = ['Test'];

    SApp: Writable<App>;
    SVault: Writable<Vault>;
    SWorkspace: Writable<Workspace>;
    SEditor: Writable<CodeMirror.Editor>;
    subscribe;
    private update;

    constructor() {
        super();
        let { subscribe, update } = writable(this);
        this.subscribe = subscribe;
        this.update = update;
    }

    initialize(app: App) {
        this.SApp = writable(app);
        this.SVault = writable(app.vault);
        this.SWorkspace = writable(app.workspace);
        this.workspace.on('codemirror', ((cm) => {
            if (!this.SEditor)
                this.SEditor = writable(cm);
            this.editor = cm;

            console.log('CHANGED CODEMIRROR');
        }));


        this.basePath = (app.vault.adapter as FileSystemAdapter).getBasePath();
        this.plugins = (app as any).internalPlugins.app.plugins.plugins;

        this.plugin = this.getPlugin('obsidian-chronicler');

        this.plugin.registerCodeMirror((cm) => {
            this.editor = cm; console.log('CHANGED CODEMIRROR 222222');
        });

        this.currentFile = this.workspace.getActiveFile();
        this.workspace.on('active-leaf-change', (l) => {
            this.currentFile = this.workspace.getActiveFile();
            console.log('\t\t\t\tChanged Active File');
        });
        // console.log(`this.plugin`, this.plugin, this.plugins);
        // console.log(`this.plugins`, this.plugins);
    }


    async create(file: File, data?: string) {
        this.updateApplicableContexts();
        // console.log(`this.activeContexts`, this.activeContexts);
        let visitor = new CreationVisitor({ file, data });
        this.activeContexts.forEach(v => this.contextMap.get(v).accept(visitor));
        // console.log(`visitor`, visitor, file, file.path);
        if (file.directory && !(await this.vault.adapter.exists(<string>file.directory)))
            await this.vault.createFolder(<string>file.directory);
        if (await this.vault.adapter.exists(<string>file.path))
            await this.vault.adapter.remove(<string>file.path); // TODO: update file instead of overwriting
        return await this.vault.create(<string>file.path, data ?? '');
    }


    contextApplies(ctxNames: string[]) {
        return ctxNames.every(n => this.contextMap.get(n).accept(new ApplicabilityVisitor()));
    }

    updateApplicableContexts() {
        this.activeContexts = []; //TODO: make event-based context updating
        for (let [key, val] of this.contextMap)
            if (val.accept(new ApplicabilityVisitor()))
                this.activeContexts.push(key);
    }

    getPlugin<T = Plugin>(id: PluginId): T { return this.plugins[id] as T; }
    getSettings<PluginSettings = ChroniclerSettings>(id: PluginId): PluginSettings { return this.plugins[id].settings as PluginSettings; }
    getManifest(id: PluginId): PluginManifest { return this.plugins[id].manifest; }

    /**
     * allows subscribers to both individual properties and the whole to be notified of changes
    */
    private dualUpdate<T extends UpdatableKeys<GlobalContext>>(which: T, value: MemberStoreType<T, GlobalContext>) {
        this.update(v => {
            (v[which] as Writable<MemberStoreType<T, GlobalContext>>)?.update(v => v = value);
            return v;
        });
    }
    sub<T extends SubscribableKeys<GlobalContext>>(which: T, u: Subscriber<any>, i?: Invalidator<any>) {
        return this[which].subscribe(u, i);
    }

    public get app(): App { return get(this.SApp); }
    public get vault(): Vault { return get(this.SVault); }
    public get workspace(): Workspace { return get(this.SWorkspace); }
    public get editor(): CodeMirror.Editor { return get(this.SEditor); }

    public set app(value: App) { this.dualUpdate('SApp', value); }
    public set vault(value: Vault) { this.dualUpdate('SVault', value); }
    public set workspace(value: Workspace) { this.dualUpdate('SWorkspace', value); }
    public set editor(value: CodeMirror.Editor) { this.dualUpdate('SEditor', value); }

}

export const Global: GlobalContext = new GlobalContext();
