import './Scheduling/refinersAndParsers';

import * as EX from './Scheduling/examples';
import * as chrono from 'chrono-node';

import { ChroniclerSettingTab, ChroniclerSettings, DEFAULT_SETTINGS } from './Settings/settings';
import { Context, ItemView, ME, Modal, Plugin, Register, Vault, WorkspaceLeaf } from './common';
import { FuzzySuggestModal, TFile } from "obsidian";
import { RRule, Weekday } from 'rrule';
import { parseFrontMatterAliases, parseFrontMatterEntry, parseFrontMatterStringArray, parseFrontMatterTags, parseYaml } from 'obsidian';

import { Attributes } from "graphology-types";
import { DirectedGraph } from "graphology";
import FlatPickr from './DateSuggestion/FlatPickr.svelte';
import { Global } from "./globalContext";
import Graph from "graphology";
import Suggestion from './DateSuggestion/Suggestion.svelte';
import { Task } from "Task";
import { TaskContext } from "./Context";
import TimeRule from "./Scheduling/Rule";
import { get } from './common';

// import Autocomplete from 'react-native-autocomplete-input';
// import { DateSuggest } from './suggest';
// import type { SvelteComponent } from "svelte";
// import autocomplete from './autocomplete.svelte';
// import * as OU from 'obsidian-utils';
// import { findVault, installPluginFromGithub } from 'obsidian-utils';




export default class Chronicler extends Plugin {
	settings: ChroniclerSettings;


	private suggestEl = createDiv("suggestion-container");
	private autosuggest: Suggestion;
	private unregister: () => void;



	async onload() {
		console.log('loading Chronicler');
		await Global.initialize(this.app);
		await this.loadSettings();

		this.addSettingTab(new ChroniclerSettingTab(this.app, this));
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


		{
			// this.registerCodeMirror((cm: CodeMirror.Editor) => {
			// 	console.log('codemirror', cm);
			// 	// cm.on("cursorActivity", (cm) => console.log("cursorActivity: ", cm));o
			// });

			this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
				console.log('click', evt);
				console.log('click', evt);
				console.log('click', evt);
				// console.log('click', evt);
				// console.log('click', evt);
				// console.log('click', evt);
				// console.log('click', evt);
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
		Global.editor = cm;
		console.log(`cm`, cm);

		this.autosuggest = new Suggestion({
			target: this.suggestEl,
			props: {
				targetRef: this.suggestEl,
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

	}
}

class ChroniclerModal/*  extends FuzzySuggestModal<string>  */ extends Modal {
	like: FlatPickr;
	getItems(): string[] {
		return ['Jeff', 'is', 'my', 'hero'];
	}
	getItemText(item: string): string {
		return item;
	}
	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
		console.log(`item`, item);
	}

	constructor() {
		super(Global.app);
	}

	async onOpen() {
		let { contentEl, containerEl } = this;

		console.log(await ME.getYamlProp('chronicler.context'));
		console.log(await ME.updateYamlProp('chronicler.context', ['uolo', 'asdf']));
		console.log(await ME.getYamlProp('chronicler.context'));
		console.log(await ME.getFilesWithProperty('chronicler.context'));


		// let active = Global.workspace.getActiveFile();
		// let mc = Global.app.metadataCache.getFileCache(active);
		// let fm = mc.frontmatter;

		// let p1 = parseFrontMatterAliases(fm);
		// let p2 = parseFrontMatterEntry(fm, 'jeff');
		// let p21 = parseFrontMatterEntry(fm, 'jxx');
		// let p22 = parseFrontMatterEntry(fm, /j/);
		// let p23 = parseFrontMatterEntry(fm, /.*j.*/);
		// let p3 = parseFrontMatterStringArray(fm, 'alias');
		// let p4 = parseFrontMatterTags(fm);
		// console.log(`active`, active);
		// console.log(`mc`, mc);
		// console.log(`fm`, fm);
		// console.log(`p1,'\n',p2,'\n',p21,'\n',p22,'\n',p23,'\n',p3,'\n',p4,'\n'`, p1, '\n', p2, '\n', p21, '\n', p22, '\n', p23, '\n', p3, '\n', p4, '\n');

		// console.log(ME.getFilesWithProperty('title'));
		// console.log(ME.getFilesWithProperty('created'));





		// console.log(await ME.getPropertyValue('rule'));
		// console.log(await ME.createYamlProperty('blurp', 'thun'));

		// this.ac = new autocomplete({ target: this.contentEl });

		// ReactDOM.render(React.createElement(DiceRoller), (this as any).contentEl);

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
