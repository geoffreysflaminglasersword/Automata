import { Activator, Equare } from "./Visitor";
import { App, File, FileSystemAdapter, Node as GNode, ME, Plugin, PluginId, PluginManifest, TFile, Task, Vault, Workspace } from "common";
import { FileContext, Rule } from "./Node";
import { Invalidator, MemberStoreType, Register, SubscribableKeys, UpdatableKeys, WritablePropertize } from "./Utils";
import { Subscriber, Writable, get, writable } from "svelte/store";

import { ChroniclerSettings } from "settings";
import { DirectedGraph } from "graphology";
import { SimpleSet } from "typescript-super-set";
import Suggestion from './DateSuggestion/Suggestion.svelte';
import { TaskContext } from "./Node";

type StoredProps = WritablePropertize<{ workspace: Workspace; editor: CodeMirror.Editor; }>;
let nodeEquare = (first: GNode, second: GNode) => first.accept(new Equare({ other: second })) ? 0 : -1;




//TODO: could make global context a Visitee so that other plugins can write their own graph visitors

/** 
 * Manages and evaluates the context graph 
 * also provides a global access point for common obsidian vars to avoid having to pass them everywhere 
*/
class GlobalContext implements StoredProps {
    // private suggestEl = createDiv("suggestion-container");
    private autosuggest: Suggestion;


    public app: App;
    public vault: Vault;
    public plugin: Plugin;
    public plugins: any;
    public basePath: string;
    public currentFile: TFile;

    public SWorkspace: Writable<Workspace>;
    public SEditor: Writable<CodeMirror.Editor>;

    public rules: Rule[] = [];
    public graph: DirectedGraph<{ node: GNode; }>;
    public nodeIndex = new SimpleSet(nodeEquare);
    public subscribe;
    private update;

    constructor() {
        let { subscribe, update } = writable(this);
        this.subscribe = subscribe;
        this.update = update;
    }

    async initialize(app: App) {
        this.app = app;
        this.vault = app.vault;
        this.basePath = (app.vault.adapter as FileSystemAdapter).getBasePath();
        this.plugins = (app as any).internalPlugins.app.plugins.plugins;
        this.plugin = this.getPlugin('obsidian-chronicler');
        this.SWorkspace = writable(app.workspace);
        this.currentFile = this.workspace.getActiveFile();
        this.registerListeners();
        await this.graphInit();
    }

    private registerListeners() {
        this.workspace.on('active-leaf-change', (l) => {
            this.currentFile = this.workspace.getActiveFile();
            // console.log('\t\t\t\tChanged Active File');
        });

        // I haven't yet investigated why, but there's an issue when I don't have both of the following listeners
        this.plugin.registerCodeMirror(((cm: CodeMirror.Editor) => {
            if (!cm) return;
            this.editor = cm;
            console.log('CHANGED CODEMIRROR 1', cm);
        }).bind(this));
        this.workspace.on('active-leaf-change', ((leaf) => {
            this.autosuggest = new Suggestion({ target: leaf.view.containerEl, props: {} });
        }));

        this.workspace.on('layout-ready', () => this.autosuggest = new Suggestion({ target: this.workspace.activeLeaf.view.containerEl, props: {} }));
        this.workspace.on('codemirror', ((cm: CodeMirror.Editor) => {
            if (!cm) return;
            if (!this.SEditor) this.SEditor = writable(cm);
            this.editor = cm;
            console.log('CHANGED CODEMIRROR 2', cm);
        }).bind(this));
    }

    private async graphInit() {
        let files = await ME.getFilesWithProperty('chronicler');
        this.graph = new DirectedGraph();
        await Promise.all(files.map(async f => {
            let task = await new Task().fromFile(f);
            this.addNode(new TaskContext(task, task.id));
        }));

        // console.log(`graph`, this.graph);



        /* NOTE: the following is a proof of concept of context evaluation
            at a high level:
                the global context contains rules
                rules perform some action when all the contexts they depend on are satisfied/active

            in this example, we add a file context
                whenever the currently active file path starts with '/tasks' we fire the rule
                the rule reassigns the directory that the task will be created in and adds it to the backlog project

            General examples we'd like to support:
                if I'm in file/directory X then write to directory Y
                if I'm in file X then assign project #Project
                if it's a weekday *and* the current time is after 5p, then assign due date of tomorrow
                if it's january set custom property quarter to 'Q1'

            ... those were examples of contexts affecting task creation...

            We'd also like to be able to filter what tasks are visible in boards using the same system:
                if I'm on board B, task A should show up after task Z is complete or due-date D has passed
                if I'm on board B, and I set the manual context to 'in my room,' I see only tasks with the location
                    attribute set to room
        */
        {
            let dir = new FileContext(/\/tasks/);
            let rule = new Rule((file, data) => {
                file.directory = 'mappedDirectory';
                data = ME.updateYamlProp('chronicler.project', 'backlog', data);
            });
            this.addNode(rule, dir);
        }
    }

    // note that rule evaluation can be used for any kind of creation, not just task creation
    async create(file: File, data?: string) {
        this.evaluateRules(file, data);
        if (file.directory && !(await this.vault.adapter.exists(file.directory)))
            await this.vault.createFolder(file.directory);
        if (await this.vault.adapter.exists(file.path))
            await this.vault.adapter.remove(file.path); // TODO: update file instead of overwriting
        return await this.vault.create(file.path, data ?? '');
    }

    async evaluateRules(file: File, data?: string) {
        let activator = new Activator({ file, data });
        console.log(`this.rules`, this.rules);
        this.rules.forEach(rule => { if (rule.accept(activator)) rule.execute(file, data); });
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

    getPlugin<T extends Plugin = Plugin>(id: PluginId): T { return this.plugins[id] as T; }
    getSettings<PluginSettings = ChroniclerSettings>(id: PluginId): PluginSettings { return this.plugins[id].settings as PluginSettings; }
    getManifest(id: PluginId): PluginManifest { return this.plugins[id].manifest; }

    public get workspace(): Workspace { return get(this.SWorkspace); }
    public set workspace(value: Workspace) { this.dualUpdate('SWorkspace', value); }
    public get editor(): CodeMirror.Editor { return get(this.SEditor); }
    public set editor(value: CodeMirror.Editor) { this.dualUpdate('SEditor', value); }
    sub<T extends SubscribableKeys<GlobalContext>>(which: T, s: Subscriber<any>, i?: Invalidator<any>) {
        return this[which].subscribe(s, i);
    }
    /** allows subscribers to both individual properties and the whole to be notified of changes */
    private dualUpdate<T extends UpdatableKeys<GlobalContext>>(which: T, value: MemberStoreType<T, GlobalContext>) {
        this.update(v => {
            (v[which] as Writable<MemberStoreType<T, GlobalContext>>)?.update(v => v = value);
            return v;
        });
    }


}

export const Global: GlobalContext = new GlobalContext();
