import './Scheduling/refinersAndParsers';

import { ChroniclerSettingTab, ChroniclerSettings, DEFAULT_SETTINGS } from './Settings/settings';
import { Global, ME, Modal, Plugin, Register } from './common';

// having issues with styling, tabling it since I don't know enough about it yet
// import "flatpickr/dist/flatpickr.min.css";
// import "./styles.css";

export default class Chronicler extends Plugin {
	settings: ChroniclerSettings;

	async onload() {
		console.log('loading Chronicler');
		await this.loadSettings();
		this.addSettingTab(new ChroniclerSettingTab(this.app, this));
		this.addCommands();
		await Global.initialize(this.app);
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
	}

	onLayoutReady(): void { }
	onunload() { console.log('unloading Chronicler'); }
	async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
	async saveSettings() { await this.saveData(this.settings); }

	addCommands() {
		// modal currently just for trying things out
		this.addCommand({
			id: 'open-Chronicler-modal',
			name: 'Open Chronicler Modal',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new ChroniclerModal().open();
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
class ChroniclerModal /*extends FuzzySuggestModal<string>*/ extends Modal {
	constructor() {
		super(Global.app);
	}

	async onOpen() {
		let { contentEl, containerEl } = this;
		console.log(await ME.asyncGetYamlProp('chronicler.context'));
		console.log(await ME.asyncUpdateYamlProp('chronicler.context', ['uolo', 'asdf']));
		console.log(await ME.asyncGetYamlProp('chronicler.context'));
		console.log(await ME.getFilesWithProperty('chronicler.context'));
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
