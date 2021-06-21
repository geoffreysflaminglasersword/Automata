import './Scheduling/refinersAndParsers';

import * as EX from './Scheduling/examples';
import * as chrono from 'chrono-node';

import { ChroniclerSettingTab, ChroniclerSettings, DEFAULT_SETTINGS } from './settings';
import { ItemView, Modal, Obsidian, Plugin, Register, Vault, WorkspaceLeaf } from './common';
import { RRule, Weekday } from 'rrule';

import { DiceRoller } from "./reactTest";
import React from "react";
import ReactDOM from "react-dom";
import Rule from "./Scheduling/Rule";
import Suggestion from './Suggestion.svelte';

// import Autocomplete from 'react-native-autocomplete-input';
// import { DateSuggest } from './suggest';
// import type { SvelteComponent } from "svelte";
// import autocomplete from './autocomplete.svelte';
// import * as OU from 'obsidian-utils';
// import { findVault, installPluginFromGithub } from 'obsidian-utils';







export default class Chronicler extends Plugin {
	settings: ChroniclerSettings;

	private suggestEl = createDiv("suggestion-container");
	private view: MyReactView;
	private autosuggest: Suggestion;
	private unregister: () => void;



	async onload() {
		console.log('loading Chronicler');
		await this.loadSettings();
		this.addSettingTab(new ChroniclerSettingTab(this.app, this));
		this.registerView(
			VIEW_TYPE,
			(leaf: WorkspaceLeaf) => (this.view = new MyReactView(leaf))
		);
		this.addCommand({
			id: 'open-Chronicler-modal',
			name: 'Open Chronicler Modal',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new ChroniclerModal(new Obsidian(this.app)).open();
					}
					return true;
				}
				return false;
			}

		});


		{
			this.registerCodeMirror((cm: CodeMirror.Editor) => {
				console.log('codemirror', cm);
				// cm.on("cursorActivity", (cm) => console.log("cursorActivity: ", cm));o
			});

			this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
				console.log('click', evt);
				console.log('click', evt);
				console.log('click', evt);
				console.log('click', evt);
				console.log('click', evt);
				console.log('click', evt);
				console.log('click', evt);
			});

			// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
			// this.addRibbonIcon('dice', 'Chronicler', () => {
			// 	new Notice('This is a notice!');
			// });
			// this.addStatusBarItem().setText('Status Bar Text');
		}
		let s: string = ''; s.length;

		// this.tryToSetupAutosuggest(); 

		this.unregister = Register(undefined, undefined, this, [['cursorActivity', this.addAutosuggest.bind(this)]]);
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
	}

	addAutosuggest(cm: CodeMirror.Editor) {
		if (!cm) return;
		this.autosuggest = new Suggestion({
			target: this.suggestEl,
			props: {
				plugin: this,
				app: this.app,
				targetRef: this.suggestEl,
				editor: cm
			}
		});
		this.unregister();
		console.log(this.autosuggest);
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onLayoutReady(): void {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE,
		});
	}


	// tryToSetupAutosuggest(): void {
	// 	if (
	// 		this.settings.autocompleteTriggerPhrase
	// 	) {
	// 		this.autosuggest = new DateSuggest(this.app, this);

	// 		this.registerCodeMirror((cm: CodeMirror.Editor) => {
	// 			cm.on("change", this.autosuggestHandler);
	// 		});
	// 	} else {
	// 		this.autosuggest = null;
	// 		this.registerCodeMirror((cm: CodeMirror.Editor) => {
	// 			cm.off("change", this.autosuggestHandler);
	// 		});
	// 	}
	// }


	// private autosuggest: DateSuggest;


	// autosuggestHandler = (
	// 	cmEditor: CodeMirror.Editor,
	// 	changeObj: CodeMirror.EditorChange
	// ): boolean => {
	// 	return this.autosuggest?.update(cmEditor, changeObj);
	// };



}



























// import { DateTime, Duration } from "luxon";







class ChroniclerModal extends Modal {
	obsidian: Obsidian;
	// ac: SvelteComponent;

	constructor(obsidian: Obsidian) {
		super(obsidian.app);
		this.obsidian = obsidian;
	}

	async onOpen() {

		let { contentEl } = this;
		// this.ac = new autocomplete({ target: this.contentEl });

		// ReactDOM.render(React.createElement(DiceRoller), (this as any).contentEl);

		// const internalPlugins = (this.app as any).internalPlugins.app.plugins.plugins;
		// const nldatesPlugin = internalPlugins["nldates-obsidian"];
		// const parsedResult = nldatesPlugin.parseDate("@every 2 days from")

		// console.log(jeff.all(() => { return count++ < 15; }));

		// /(?<=^[^,]*)\w+,(\w+,?)+?( ([^,])+?\s)/gm // matches if contains only one comma delimited set
		// /((\w+?),(?:(\w+),?)+?) (?:\w+?,(?:\w,?)+)/gm // matches if contains two comma delimited sets 

		let print = (input: string) => {

			try {
				let x = chrono.casual.parseDate(input);
				console.log((x ? 'SUCCEEDED ' : 'FAILED ') + 'chrono: %c' + input, x ? 'color:green' : 'color:orange');
				console.log(x, '\n', x ? chrono.casual.parse(input) : '', '\n');
			} catch (error) {
				console.log('ERROR chrono: %c' + input, 'color:red');
			}
			try {
				let x = RRule.parseText(input);
				x.wkst = RRule.SU;
				console.log((x ? 'SUCCEEDED ' : 'FAILED ') + 'rrule: %c' + input, x ? 'color:green' : 'color:orange');
				let dates: Date[] = new RRule(x).all((d, n) => (n < 10));
				console.log(x, '\n', dates, '\n');

			} catch (error) {
				console.log('ERROR RRule: %c' + input, 'color:red');
			}
		};

		let window = EX.working.length;
		let start = 10;
		let examples = EX.shouldWork.filter((_, idx) => { return idx >= start && idx < start + window; }); // grabbing only 10 at a time

		// for (let i of examples) {

		// 	console.log('%c' + i, 'color:green');
		// 	let t = new Rule(i, this.obsidian);
		// 	console.log("End Result: ", t);
		// 	let count = 0;
		// 	for (let i of t.all()) console.log("%c result: " + i.toUTCString() + "   " + i, 'color:orange');

		// 	// let arr = GetClauses(i, C_MATCHER, E.CLAUSES);
		// 	// console.log('\n\n\n', arr);
		// 	// if (arr.length) for (let a of arr) (arr.indexOf(a) == 0) ? print('every ' + a) : print(a);
		// 	// else print('every ' + i.replace(/\@/, ''));
		// }

		console.log(chrono.parseDate('2024'));
		console.log(chrono.parseDate('2024CE'));
		console.log(chrono.parseDate('2024BCE'));
		console.log(chrono.parseDate('100BC'));



		{
			// let x = new RRuleSet(true);
			// x.rrule(new RRule(RRule.parseText('every mon for 25 times')));
			// x.rrule(new RRule(RRule.parseText('every sat for 25 times')));
			// x.rrule(new RRule(RRule.parseText('every wed for 25 times')));
			// console.log(x);
			// let count = 0;
			// for (let i of x.all(() => count++ < 100)) console.log("%c result: " + i.toUTCString(), 'color:orange');


			// let times = ['3am', '3:00', '3:00pm'];
			// for (let t of times) {
			// 	let x = chrono.casual.parseDate(t);
			// 	let y = DateTime.fromObject({ hour: x.getHours(), minute: x.getMinutes(), second: x.getSeconds() });
			// 	console.log(y.toISO());
			// 	let z = Duration.fromObject({ hours: 2, minutes: 7 });
			// 	y = y.plus(z);
			// 	console.log(y.toUTC().toISO());
			// }




			// const rruleSet = new RRuleSet();

			// // Add a rrule to rruleSet
			// rruleSet.rrule(new RRule({
			// 	freq: RRule.MONTHLY,
			// 	count: 120,
			// 	dtstart: new Date(Date.UTC(2012, 1, 1)),

			// }));

			// // rruleSet.rrule(new RRule({
			// // 	freq: RRule.MONTHLY,
			// // 	count: 120,
			// // 	dtstart: new Date(Date.UTC(2016, 2, 1))
			// // }));

			// rruleSet.exrule(new RRule({
			// 	freq: RRule.MONTHLY,
			// 	// count: 5,
			// 	dtstart: new Date(Date.UTC(2012, 6, 1)),
			// 	until: new Date(Date.UTC(2016, 5, 1))


			// }));
			// rruleSet.dtstart = new Date(Date.UTC(2016, 3, 1));

			// console.log(rruleSet);
			// count = 0;
			// console.log(rruleSet.all(() => { return count++ < 24; }));

			// contentEl.appendText();
		}
	}



	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}






const VIEW_TYPE = "react-view";

class MyReactView extends ItemView {
	private reactComponent: React.ReactElement;

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Dice Roller";
	}

	getIcon(): string {
		return "calendar-with-checkmark";
	}

	async onOpen(): Promise<void> {
		this.reactComponent = React.createElement(DiceRoller);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ReactDOM.render(this.reactComponent, (this as any).contentEl);
	}
}

