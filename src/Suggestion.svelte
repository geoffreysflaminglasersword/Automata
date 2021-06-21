<script lang="ts">
  import { Editor } from "obsidian";

  import {
    App,
    Plugin,
    Scope,
    CM_Map,
    settings,
    onMount,
    onDestroy,
    Keys,
    setContext,
    Register,
    isNullOrWhitespace,
  } from "./common";
  import Rule from "./Scheduling/Rule";
  import SuggestionContainer from "./SuggestionContainer.svelte";
  import { regexIndexOf, rxLastWordOrSpace } from "./Utils";

  export let app: App, plugin: Plugin, targetRef: HTMLElement, editor: CodeMirror.Editor;
  $: if (!editor) throw new Error("in suggestion: editor must always exist");

  let [isOpen, chosen, scope] = [false, "", new Scope()];
  setContext(Keys.suggestion, { app, plugin, scope, editor });

  $: insertMod = $settings.insertDatesModifier;
  $: trigger = $settings.autocompleteTriggerPhrase;
  $: matchToTrigger = new RegExp(".*" + trigger + "");

  $: cursor = editor.getCursor();
  $: lineNo = cursor.line;
  $: line = editor.getLine(lineNo);

  $: triggerPos = regexIndexOf(line, new RegExp(trigger), 0);
  $: foundTrigger = triggerPos >= 0;
  let isSingleCursor = true;
  $: shouldOpen = isSingleCursor && foundTrigger && !document.querySelector(".suggestion-container");
  $: shouldClose = !foundTrigger || cursor.ch <= triggerPos;

  $: lineWOTrigger = line.replace(matchToTrigger, "");
  $: excess = line.length - lineWOTrigger.length;
  $: currentWord = lineWOTrigger.substring(0, cursor.ch - excess).match(rxLastWordOrSpace)[0];
  // $: currentWord = editor.getRange({ line: cursor.line, ch: 0 }, cursor).match(rxLastWord)[0];

  $: if (shouldClose) close();
  else if (shouldOpen) isOpen = true;
  $: if (!shouldClose && shouldOpen) editor.addWidget(cursor, targetRef, true);

  function update(cm: CodeMirror.Editor, cc: CodeMirror.EditorChange) {
    if (editor !== cm) close();
    let change: CodeMirror.EditorChange;
    [editor, change] = [cm, cc];
    isSingleCursor = change.text.length == 1;
  }

  function onCursorMove(cm: CodeMirror.Editor) {
    if (editor !== cm) close();

    cursor = editor.getCursor();
  }

  let select = (event: KeyboardEvent | MouseEvent) => {
    let modifierHeld = event[CM_Map[insertMod]];
    let isConfirmation: boolean = false,
      blank = isNullOrWhitespace(chosen);

    if (event instanceof KeyboardEvent)
      if (event.isComposing || (event.key == "Tab" && blank)) return;
      else if (event.key == "Enter") isConfirmation = true;
    if (modifierHeld) {
      if (event instanceof MouseEvent || isConfirmation) {
        // insert links to dates
      }
    } else {
      if (isConfirmation) {
        let t = new Rule(editor.getLine(lineNo));
        t.print();
      } else if (!blank) {
        let { start: start, end: end, string: token } = editor.getTokenAt(cursor);
        let idx = token.indexOf(trigger);
        start += idx == -1 ? 0 : idx + trigger.length;
        editor.replaceRange(chosen, { line: lineNo, ch: start }, { line: lineNo, ch: end });
      }
    }
  };

  function close(): void {
    (isOpen = false), targetRef.detach();
  }

  onMount(() => {
    unregister = Register(
      scope,
      [
        [[], "Enter", select],
        [[], "Tab", select],
        [[], "Escape", close],
        [[insertMod], "Enter", select],
      ],
      plugin,
      [
        ["change", update],
        ["cursorActivity", onCursorMove],
      ]
    );
  });
  onDestroy(() => {
    unregister();
  });
  let unregister: () => void;
</script>

{#if isOpen}
  <SuggestionContainer on:click={select} bind:current={chosen} input={currentWord} />
  <div>
    {lineWOTrigger} , {currentWord}
  </div>
{/if}
