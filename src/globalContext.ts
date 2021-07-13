import { Activator, Equare } from "./Visitor";
import { App, File, FileSystemAdapter, Node as GNode, ME, Plugin, PluginId, PluginManifest, Vault, Workspace } from "common";
import { CompositeContext, Context, FileContext, Rule } from "./Context";
import { Invalidator, MemberStoreType, SubscribableKeys, UpdatableKeys, WritablePropertize, getUpdateOrder } from "./Utils";
import { Subscriber, Writable, get, writable } from "svelte/store";

import { ChroniclerSettings } from "settings";
import CodeMirror from "codemirror";
import { DirectedGraph } from "graphology";
import { SimpleSet } from "typescript-super-set";
import { TFile } from "obsidian";
import { Task } from "Task";
import { TaskContext } from "./Context";

// import Autocomplete from 'react-native-autocomplete-inp

// export const globalContext = writable({
//     taskIndex: 0,
//     currentEditor: <CodeMirror.Editor>null,
// });
interface ObsidianCommon { app: App; vault: Vault; workspace: Workspace; editor: CodeMirror.Editor; }
;
type PrivateStoredProps = WritablePropertize<ObsidianCommon>;
// type PrivateStoredPropKeys = keyof PrivateStoredProps;
// export interface Obsidian extends Omit<_Obsidian, PrivateStoredPropKeys> { }
class GlobalContext implements PrivateStoredProps {
    // contextMap = new Map<string, Context>([
    //     ['Test', new FileContext('task/', 'jeff/')]
    // ]);

    rules: Rule[] = [];
    nodeIndex = new SimpleSet<GNode>((l, other) => l.accept(new Equare({ other })) ? 0 : -1);

    // TODO: make these writable stores
    basePath: string;
    plugins: any;
    currentFile: TFile;
    activeContexts: string[] = ['Test'];
    SWorkspace: Writable<Workspace>;
    SEditor: Writable<CodeMirror.Editor>;

    // TODO: convert to readable
    plugin: Plugin;
    SApp: Writable<App>;
    SVault: Writable<Vault>;


    graph: DirectedGraph<{ node: GNode; }>;
    subscribe;
    private update;

    constructor() {
        let { subscribe, update } = writable(this);
        this.subscribe = subscribe;
        this.update = update;
    }

    async initialize(app: App) {
        this.SApp = writable(app);
        this.SVault = writable(app.vault);
        this.SWorkspace = writable(app.workspace);
        this.workspace.on('codemirror', ((cm) => {
            if (!this.SEditor)
                this.SEditor = writable(cm);
            this.editor = cm;

            console.log('CHANGED CODEMIRROR', cm);
        }));


        this.basePath = (app.vault.adapter as FileSystemAdapter).getBasePath();
        this.plugins = (app as any).internalPlugins.app.plugins.plugins;

        this.plugin = this.getPlugin('obsidian-chronicler');

        this.plugin.registerCodeMirror((cm) => {
            this.editor = cm; console.log('CHANGED CODEMIRROR 222222', cm);
        });

        this.currentFile = this.workspace.getActiveFile();
        this.workspace.on('active-leaf-change', (l) => {
            this.currentFile = this.workspace.getActiveFile();
            console.log('\t\t\t\tChanged Active File');
        });
        // console.log(`this.plugin`, this.plugin, this.plugins);
        // console.log(`this.plugins`, this.plugins);

        let files = await ME.getFilesWithProperty('chronicler');
        this.graph = new DirectedGraph();
        await Promise.all(files.map(async f => {
            console.log(`file: `, f);
            let task = await new Task().fromFile(f);
            this.addNode(new TaskContext(task, task.id));
        }));

        console.log(`graph`, this.graph);


        let rule = new Rule((file, data) => file.directory = '2jeff2crazzee');
        let dir = new FileContext(/\/tasks/);
        this.addNode(rule, dir);
    }

    addNode(node: GNode, dependency?: GNode) {
        let res: string;
        if (!this.nodeIndex.has(node)) {
            this.nodeIndex.add(node);
            res = this.graph.addNode(node.id, { node });
        }
        if (dependency) {
            if (!this.nodeIndex.has(dependency)) {
                this.nodeIndex.add(dependency);
                this.graph.addNode(dependency.id, { node: dependency });
            }
            this.graph.addDirectedEdge(node.id, dependency.id);
        }
        if (node instanceof Rule) this.rules.push(node);
        if (dependency instanceof Rule) this.rules.push(dependency);
        console.log(`this.nodeIndex, this.rules,this.graph`, this.nodeIndex, this.rules, this.graph);
        return res;
    }

    async evaluateRules(file: File, data?: string) {
        let activator = new Activator({ file, data });
        console.log(`this.rules`, this.rules);
        this.rules.forEach(rule => { if (rule.accept(activator)) rule.execute(file, data); });
    }



    async create(file: File, data?: string) {
        this.evaluateRules(file, data);
        // console.log(`this.activeContexts`, this.activeContexts);
        // console.log(`visitor`, visitor, file, file.path);
        if (file.directory && !(await this.vault.adapter.exists(file.directory)))
            await this.vault.createFolder(file.directory);
        if (await this.vault.adapter.exists(file.path))
            await this.vault.adapter.remove(file.path); // TODO: update file instead of overwriting

        return await this.vault.create(file.path, data ?? '');
    }

    getPlugin<T extends Plugin = Plugin>(id: PluginId): T { return this.plugins[id] as T; }
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
