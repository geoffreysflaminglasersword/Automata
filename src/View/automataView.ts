import { ItemView, Workspace, WorkspaceLeaf } from "common";

import AutomataView from "./AutomataView.svelte";

export class AView extends ItemView {
    view: AutomataView;

    //constructor
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return 'automata';
    }
    getDisplayText(): string {
        return 'Automata';
    }

    async onOpen() {
        this.view = new AutomataView({
            target: this.contentEl
        });
    }

    async onClose() {
        this.view.$destroy();
    }

} 

export function addView(workspace: Workspace, type?: string) {
    workspace.detachLeavesOfType(type ?? 'automata');
    let leaf = workspace.createLeafInParent(workspace.rootSplit, 0);
    leaf.setViewState({ type: type ?? 'automata', active: true });
    workspace.revealLeaf(leaf);
}