import "source-map-support/register";
import './Scheduling/refinersAndParsers';

import { AView, Global, ME, Modal, Plugin, Register } from './common';
import { AutomataSettingTab, AutomataSettings, DEFAULT_SETTINGS } from './Settings/settings';

import { addView } from "./View/automataView";

// having issues with styling, tabling it since I don't know enough about it yet
// import "flatpickr/dist/flatpickr.min.css";
// import "./styles.css";

export default class Automata extends Plugin {
	settings: AutomataSettings;

	async onload() {
		console.log('loading Automata');
		await this.loadSettings();
		this.addSettingTab(new AutomataSettingTab(this.app, this));
		this.registerViews();
		this.addCommands();
		await Global.initialize(this.app);
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
	}

	onLayoutReady(): void { }

	onunload() { console.log('unloading Automata'); }
	async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
	async saveSettings() { await this.saveData(this.settings); }

	registerViews()  {
		this.registerView('automata', (leaf) => new AView(leaf));
		this.addRibbonIcon("dice", "Open Automata", (() => { addView(this.app.workspace);}).bind(this));
	 }

	//compute the answer

	addCommands() {
		// this command will open an automata view
		this.addCommand({
			id:'open-Automata-view',
			name: 'Open Automata View',
			callback: () => { addView(this.app.workspace); }
		})
		
		// modal currently just for trying things out
		this.addCommand({
			id: 'open-Automata-modal',
			name: 'Open Automata Modal',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new AutomataModal().open();
					}
					return true;
				}
				return false;
			}

		});

		//this command will list all files in the vault containing the string "automata" in their yaml data
		this.addCommand({
			id: 'list-Automata-files',
			name: 'List Automata Files',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						let files = ME.getFilesWithProperty('automata');
						console.log(files);
					}
					return true;
				}
				return false;
			}
		});		

		// this only here to add lines in console for visual separation while debugging
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
			// console.log('click', evt);
			// console.log('click', evt);
		});
	}
}


/** only here for testing random stuff  */
class AutomataModal /*extends FuzzySuggestModal<string>*/ extends Modal {
	constructor() {
		super(Global.app);
	}
	// cal: Calendar;
	async onOpen() {
		let { contentEl, containerEl } = this;
		// this.cal = new Calendar({ target: containerEl });

		// console.log(await ME.asyncGetYamlProp('Automata.context'));
		// console.log(await ME.asyncUpdateYamlProp('Automata.context', ['uolo', 'asdf']));
		// console.log(await ME.asyncGetYamlProp('Automata.context'));
		// console.log(await ME.getFilesWithProperty('Automata.context'));

	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}

	// getItems(): string[] {
	// 	return ['Jeff', 'is', 'my', 'hero'];
	// }
	// getItemText(item: string): string {
	// 	return item;
	// }
	// onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
	// 	console.log(`item`, item);
	// }
}





