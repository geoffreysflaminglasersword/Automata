import { Activator, Equare } from "./Visitor";
import { App, File, FileSystemAdapter, Node as GNode, ME, Plugin, PluginId, PluginManifest, TFile, Task, Vault, Workspace, style } from "common";
import { FileContext, Rule } from "./Node";
import { Invalidator, MemberStoreType, Register, SubscribableKeys, UpdatableKeys, WritablePropertize } from "./Utils";
import { Subscriber, Writable, get, writable } from "svelte/store";

import { AutomataSettings } from "settings";
import { DirectedGraph } from "graphology";
import { SimpleSet } from "typescript-super-set";
import Suggestion from './DateSuggestion/Suggestion.svelte';
import { TaskContext } from "./Node";

type StoredProps = WritablePropertize<{ workspace: Workspace; editor: CodeMirror.Editor; }>;
let nodeEquare = (first: GNode, second: GNode) => first.accept(new Equare({ other: second })) ? 0 : -1;


//FUTURE: I'd like to be able to do event based stuff as well, not just contextual
// i.e. when task is moved to a new lane, record the date it was moved

//NOTE: One thing that is quite annoying about Todoist it the friction there is for seeing completed tasks
//TODO: make it so ctrl+click on the calendar opens a board with the tasks completed on that day
//also, of course, make it possible to filter a board by 'completed before yesterday' for example
//TODO: when rules are more fleshed out, make sure that a user can rename a rule (replace it's id) and select/compose multiple rules

//TODO:.5 could make global context a Visitee so that other plugins can write their own graph visitors

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
        this.plugin = this.getPlugin('obsidian-Automata');
        this.SWorkspace = writable(app.workspace);
        this.currentFile = this.workspace.getActiveFile();
        await this.graphInit();
        this.registerListeners();
    }
    

    private registerListeners() {

        /* this automatically takes care of unregistering each of these listeners 
            when the plugin is unloaded */
        // this.plugin.registerEvent.boundMulti(this.plugin,
        //     this.workspace.on('active-leaf-change', (l) => {
        //         this.currentFile = this.workspace.getActiveFile();
        //     }),

        //     this.workspace.on('codemirror', (cm: CodeMirror.Editor) => {
        //         console.log('CHANGED CODEMIRROR', cm,this);
        //         if (!cm) return;
        //         this.SEditor ??= writable(cm);
        //         this.editor = cm;
        //     }),

        //     this.workspace.on('layout-change', () => {
        //         console.log('%c layout-change', style, this.autosuggest);
        //         this.autosuggest ??= new Suggestion({ target: this.workspace.activeLeaf.view.containerEl.parentElement, props: {} });
        //     }),
    
        //     this.workspace.on('file-change', (file: File) => {
        //         console.log('%c file-change', style, file);
        //     }),
    
        //     this.workspace.on('file-create', (file: File) => {
        //         console.log('%c file-create', style, file);
        //     }),

        //     this.workspace.on('active-leaf-change', ((leaf) => {
        //         console.log('%c active-leaf-change', style, leaf);
        //     })),
        // );
        this.plugin.registerEvent(
            this.workspace.on('active-leaf-change', (l) => {
                this.currentFile = this.workspace.getActiveFile();
            })
        );
        this.plugin.registerEvent(
            this.workspace.on('codemirror', (cm: CodeMirror.Editor) => {
                console.log('CHANGED CODEMIRROR', cm, this);
                if (!cm) return;
                this.SEditor ??= writable(cm);
                this.editor = cm;
            })
        );
        this.plugin.registerEvent(
            this.workspace.on('layout-change', () => {
                console.log('%c layout-change', style, this.autosuggest);
                this.autosuggest ??= new Suggestion({ target: this.workspace.activeLeaf.view.containerEl.parentElement, props: {} });
            })
        );
        this.plugin.registerEvent(
            this.workspace.on('file-change', (f: File) => {
                console.log('%c file-change', style, file);
            })
        );
        this.plugin.registerEvent(
            this.workspace.on('file-create', (file: File) => {
                console.log('%c file-create', style, file);
            })
        );
        this.plugin.registerEvent(
            this.workspace.on('active-leaf-change', ((leaf) => {
                console.log('%c active-leaf-change', style, leaf);
            }))
        );
    }

    private async graphInit() {
        let files = await ME.getFilesWithProperty('automata');
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

            We'd also like to be able to filter what tasks are visible in kanban boards using the same system:
                if I'm on board B, task A should show up after task Z is complete or due-date D has passed
                if I'm on board B, and I set the manual context to 'in my room,' I see only tasks with the location
                    attribute set to room
            Even further, we'd like to be able to do things with kanban lanes like:
                if task is in lane L, set status to 'in Progress'
            Extra examples:
                if I've written 1000 words today set Task X to 'done'

        */
        {
            let dir = new FileContext(/\/tasks/);
            let rule = new Rule((file, data) => {
                file.directory = 'mappedDirectory';
                data = ME.updateYamlProp('automata.project', 'backlog', data);
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
        // console.log(`this.nodeIndex, this.rules,this.graph`, this.nodeIndex, this.rules, this.graph);
        return res;
    }

    getPlugin<T extends Plugin = Plugin>(id: PluginId): T { return this.plugins[id] as T; }
    getSettings<PluginSettings = AutomataSettings>(id: PluginId): PluginSettings { return this.plugins[id].settings as PluginSettings; }
    getManifest(id: PluginId): PluginManifest { return this.plugins[id].manifest; }

    public get workspace(): Workspace { return get(this.SWorkspace); }
    public set workspace(value: Workspace) { this.dualUpdate('SWorkspace', value); console.log('\t\t\tupdated workspace'); }
    public get editor(): CodeMirror.Editor { return get(this.SEditor); }
    public set editor(value: CodeMirror.Editor) { this.dualUpdate('SEditor', value); console.log('\t\t\tupdated editor'); }
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





