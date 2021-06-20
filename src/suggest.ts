import { App } from "obsidian";
import Chronicler from "./main";

interface IDateCompletion {
    label: string;
}

function checkForInputPhrase(cmEditor: CodeMirror.Editor, pos: CodeMirror.Position, phrase: string): boolean {
    const from = {
        line: pos.line,
        ch: pos.ch - (phrase.length + 1),
    };
    return !!cmEditor.getRange(from, pos).match(phrase);
}

function isCursorBeforePos(pos: CodeMirror.Position, cursor: CodeMirror.Position): boolean {
    if (pos.line === cursor.line) {
        return cursor.ch < pos.ch;
    }
    return cursor.line < pos.line;
}

export abstract class CodeMirrorSuggest<T> implements ISuggestOwner<T> {
    protected app: App;
    protected cmEditor: CodeMirror.Editor;
    private scope: Scope;

    private suggestEl: HTMLElement;
    private instructionsEl: HTMLElement;
    private suggest: Suggest<T>;

    private startPos: CodeMirror.Position;
    private triggerPhrase: string;

    constructor(app: App, triggerPhrase: string) {
        this.triggerPhrase = triggerPhrase;
        this.app = app;
        this.scope = new Scope();

        this.suggestEl = createDiv("suggestion-container");
        const suggestion = this.suggestEl.createDiv("suggestion");
        this.instructionsEl = this.suggestEl.createDiv("prompt-instructions");
        this.suggest = new Suggest(this, suggestion, this.scope);

        this.scope.register([], "Escape", this.close.bind(this));
    }

    public setInstructions(createInstructionsFn: (containerEl: HTMLElement) => void): void {
        this.instructionsEl.empty();
        createInstructionsFn(this.instructionsEl);
    }

    public update(cmEditor: CodeMirror.Editor, changeObj: CodeMirror.EditorChange): boolean {
        if (this.cmEditor !== cmEditor) {
            this.suggestEl?.detach();
            this.cmEditor = cmEditor;
        }
        const cursorPos = cmEditor.getCursor();

        // autosuggest is open
        if (this.suggestEl.parentNode) {
            if (isCursorBeforePos(this.startPos, cursorPos)) {
                //TODO: this would be better if triggered by a cursor move, the modal doesn't close until something is typed when the cursor moves back
                this.close();
                return false;
            }
            this.attachAtCursor();
        } else {
            if (
                changeObj.text.length === 1 && // ignore multi-cursors
                checkForInputPhrase(this.cmEditor, cursorPos, this.triggerPhrase) &&
                !document.querySelector(".suggestion-container") // don't trigger multiple autosuggests
            ) {
                this.startPos = cursorPos;
                this.open();
                this.attachAtCursor();
            }
        }

        return false;
    }

    protected getStartPos(): CodeMirror.Position {
        return {
            line: this.startPos.line,
            ch: this.startPos.ch - this.triggerPhrase.length,
        };
    }

    protected getInputStr(): string {
        // return string from / to cursor
        const cursor = this.cmEditor.getCursor();
        const line = this.cmEditor.getLine(cursor.line);
        return line.substring(this.startPos.ch, cursor.ch);
    }

    private attachAtCursor() {
        const inputStr = this.getInputStr();
        const suggestions = this.getSuggestions(inputStr);
        this.suggest.setSuggestions(suggestions);
        this.cmEditor.addWidget(this.cmEditor.getCursor(), this.suggestEl, true);
    }

    open(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.pushScope(this.scope);
    }

    close(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.popScope(this.scope);
        this.startPos = null;
        this.suggest.setSuggestions([]);
        this.suggestEl.detach();
    }

    abstract getSuggestions(inputStr: string): T[];
    abstract renderSuggestion(item: T, el: HTMLElement): void;
    abstract selectSuggestion(item: T, evt: MouseEvent | KeyboardEvent): void;
}

import { ISuggestOwner, Scope } from "obsidian";

export const wrapAround = (value: number, size: number): number => {
    return ((value % size) + size) % size;
};

export class Suggest<T> {
    private owner: ISuggestOwner<T>;
    private values: T[];
    private suggestions: HTMLDivElement[];
    private selectedItem: number;
    private containerEl: HTMLElement;

    constructor(owner: ISuggestOwner<T>, containerEl: HTMLElement, scope: Scope) {
        this.owner = owner;
        this.containerEl = containerEl;

        containerEl.on("click", ".suggestion-item", this.onSuggestionClick.bind(this));
        containerEl.on("mousemove", ".suggestion-item", this.onSuggestionMouseover.bind(this));

        scope.register([], "ArrowUp", (event) => {
            if (!event.isComposing) {
                this.setSelectedItem(this.selectedItem - 1, true);
                return false;
            }
        });

        scope.register([], "ArrowDown", (event) => {
            if (!event.isComposing) {
                this.setSelectedItem(this.selectedItem + 1, true);
                return false;
            }
        });

        const selectItem = (event: KeyboardEvent) => {
            if (!event.isComposing) {
                this.useSelectedItem(event);
                return false;
            }
        };
        scope.register([], "Enter", selectItem);
        scope.register(["Shift"], "Enter", selectItem);
    }

    onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
        event.preventDefault();

        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
        this.useSelectedItem(event);
    }

    onSuggestionMouseover(_event: MouseEvent, el: HTMLDivElement): void {
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
    }

    setSuggestions(values: T[]): void {
        this.containerEl.empty();
        const suggestionEls: HTMLDivElement[] = [];

        values.forEach((value) => {
            const suggestionEl = this.containerEl.createDiv("suggestion-item");
            this.owner.renderSuggestion(value, suggestionEl);
            suggestionEls.push(suggestionEl);
        });

        this.values = values;
        this.suggestions = suggestionEls;
        this.setSelectedItem(0, false);
    }

    useSelectedItem(event: MouseEvent | KeyboardEvent): void {
        const currentValue = this.values[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, event);
        }
    }

    setSelectedItem(selectedIndex: number, scrollIntoView: boolean): void {
        const normalizedIndex = wrapAround(selectedIndex, this.suggestions.length);
        const prevSelectedSuggestion = this.suggestions[this.selectedItem];
        const selectedSuggestion = this.suggestions[normalizedIndex];

        prevSelectedSuggestion?.removeClass("is-selected");
        selectedSuggestion?.addClass("is-selected");

        this.selectedItem = normalizedIndex;

        if (scrollIntoView) {
            selectedSuggestion.scrollIntoView(false);
        }
    }
}

export class DateSuggest extends CodeMirrorSuggest<IDateCompletion> {
    plugin: Chronicler;
    constructor(app: App, plugin: Chronicler) {
        super(app, plugin.settings.autocompleteTriggerPhrase);
        this.plugin = plugin;

        this.updateInstructions();
    }

    open(): void {
        super.open();
        // update the instructions since they are settings-dependent
        this.updateInstructions();
    }

    protected updateInstructions(): void {
        this.setInstructions((containerEl) => {
            containerEl.createDiv("prompt-instructions", (instructions) => {
                instructions.createDiv("prompt-instruction", (instruction) => {
                    instruction.createSpan({
                        cls: "prompt-instruction-command",
                        text: "Shift",
                    });
                    instruction.createSpan({
                        text: "Keep text as alias",
                    });
                });
            });
        });
    }

    getSuggestions(inputStr: string): IDateCompletion[] {
        // handle no matches
        const suggestions = this.getDateSuggestions(inputStr);
        if (suggestions.length) {
            return suggestions;
        } else {
            return [{ label: inputStr }];
        }
    }

    getDateSuggestions(inputStr: string): IDateCompletion[] {
        if (inputStr.match(/(next|last|this)/i)) {
            const reference = inputStr.match(/(next|last|this)/i)[1];
            return ["week", "month", "year", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                .map((val) => ({ label: `${reference} ${val}` }))
                .filter((items) => items.label.toLowerCase().startsWith(inputStr));
        }

        const relativeDate = inputStr.match(/^in ([+-]?\d+)/i) || inputStr.match(/^([+-]?\d+)/i);
        if (relativeDate) {
            const timeDelta = relativeDate[1];
            return [
                { label: `in ${timeDelta} minutes` },
                { label: `in ${timeDelta} hours` },
                { label: `in ${timeDelta} days` },
                { label: `in ${timeDelta} weeks` },
                { label: `in ${timeDelta} months` },
                { label: `${timeDelta} days ago` },
                { label: `${timeDelta} weeks ago` },
                { label: `${timeDelta} months ago` },
            ].filter((items) => items.label.toLowerCase().startsWith(inputStr));
        }

        return [{ label: "Today" }, { label: "Yesterday" }, { label: "Tomorrow" }].filter((items) =>
            items.label.toLowerCase().startsWith(inputStr)
        );
    }

    renderSuggestion(suggestion: IDateCompletion, el: HTMLElement): void {
        el.setText(suggestion.label);
    }

    selectSuggestion(suggestion: IDateCompletion, event: KeyboardEvent | MouseEvent): void {
        const includeAlias = event.shiftKey;

        const head = this.getStartPos();
        const anchor = this.cmEditor.getCursor();

        //   let dateStr = this.plugin.parseDate(suggestion.label).formattedString;
        // 	if (includeAlias) {
        // 	  dateStr = `[[${dateStr}|${suggestion.label}]]`;
        // 	} else {
        // 	  dateStr = `[[${dateStr}]]`;
        // 	}

        //   this.cmEditor.replaceRange(dateStr, head, anchor);
        this.close();
    }
}
