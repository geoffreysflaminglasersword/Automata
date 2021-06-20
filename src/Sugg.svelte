<script lang="ts">
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
  import SuggestionContainer from "./SuggestionContainer.svelte";
  import { regexIndexOf, rxLastWord } from "./Utils";

  export let app: App,
    plugin: Plugin,
    targetRef: HTMLElement,
    editor: CodeMirror.Editor,
    change: CodeMirror.EditorChange;
  $: if (!editor || !change) throw new Error("in suggestion: editor and change must always exist");

  let disableTab = {
    Tab: (cm: CodeMirror.Editor) => {
      cm.replaceSelection(" ", "end");
    },
  };

  let [isOpen, chosen, scope] = [false, "", new Scope()];
  setContext(Keys.suggestion, { app, plugin, scope });

  $: insertMod = $settings.insertDatesModifier;
  $: trigger = $settings.autocompleteTriggerPhrase;
  $: matchToTrigger = new RegExp(".*" + trigger + "");

  $: cursor = editor.getCursor();
  $: lineNo = cursor.line;
  $: line = editor.getLine(lineNo);

  $: triggerPos = regexIndexOf(line, new RegExp(trigger), 0);
  $: foundTrigger = triggerPos >= 0;
  $: isSingleCursor = change.text.length === 1;
  $: shouldOpen = isSingleCursor && foundTrigger && !document.querySelector(".suggestion-container");
  $: shouldClose = !foundTrigger || cursor.ch <= triggerPos;

  $: lineWOTrigger = line.replace(matchToTrigger, "");
  $: excess = line.length - lineWOTrigger.length;
  $: currentWord = lineWOTrigger.substring(0, cursor.ch - excess).match(rxLastWord)[0];
  // $: currentWord = editor.getRange({ line: cursor.line, ch: 0 }, cursor).match(rxLastWord)[0];

  $: if (shouldClose) close();
  else if (shouldOpen) isOpen = true;
  $: if (!shouldClose && shouldOpen) {
    editor.addWidget(cursor, targetRef, true);
  }

  function update(c: CodeMirror.Editor, cc: CodeMirror.EditorChange) {
    if (editor !== c) close();
    [editor, change] = [c, cc];
  }
  function onCursorMove(cm: CodeMirror.Editor) {
    cursor = editor.getCursor();
  }
  let select = (event: KeyboardEvent | MouseEvent) => {
    if (isNullOrWhitespace(chosen)) return;
    console.log("GERE: ", event);
    if (event instanceof KeyboardEvent && event.isComposing) return;
    if ((event instanceof MouseEvent || event.key == "Enter") && event[CM_Map[insertMod]]) {
      // insert links to dates
      console.log("here: ", event[CM_Map[insertMod]]);
      return;
    }

    let start = regexIndexOf(line, /(?<=\s|@)\w*?$/, 0); //TODO:use triggerphrase instead of @
    editor.replaceRange(chosen, { line: lineNo, ch: start }, cursor);
  };
  function close(): void {
    (isOpen = false), targetRef.detach();
  }

  let unregister: () => void;
  onMount(() => {
    editor.addKeyMap(disableTab);
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
    editor.removeKeyMap(disableTab);
  });
</script>

{#if isOpen}
  <SuggestionContainer on:click={select} bind:current={chosen} input={currentWord} />
  <div>
    {lineWOTrigger} , {currentWord}
  </div>
{/if}
