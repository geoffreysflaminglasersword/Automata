<script lang="ts">
  import { App, Plugin, Scope, settings, onMount, onDestroy, Keys, setContext, Register } from "./common";
  import SuggestionContainer from "./SuggestionContainer.svelte";
  import { regexIndexOf, rxLastWord } from "./Utils";

  export let app: App,
    plugin: Plugin,
    targetRef: HTMLElement,
    editor: CodeMirror.Editor,
    change: CodeMirror.EditorChange;
  $: if (!editor || !change) throw new Error("in suggestion: editor and change must always exist");

  let isOpen: Boolean = false,
    chosen: string,
    scope = new Scope();
  setContext(Keys.suggestion, { app, plugin, scope });

  $: trigger = $settings.autocompleteTriggerPhrase;
  $: matchToTrigger = new RegExp("/.*" + trigger + "/");

  $: cursor = editor.getCursor();
  $: line = editor.getLine(cursor.line);

  $: triggerPos = regexIndexOf(line, new RegExp(trigger), 0);
  $: foundTrigger = triggerPos >= 0;
  $: isSingleCursor = change.text.length === 1;
  $: shouldOpen = isSingleCursor && foundTrigger && !document.querySelector(".suggestion-container");
  $: shouldClose = !foundTrigger || cursor.ch <= triggerPos;

  $: currentWord = editor.getRange({ line: cursor.line, ch: 0 }, cursor).match(rxLastWord)[0];
  $: lineWOTrigger = line.replace(matchToTrigger, " ");

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
    if (event instanceof KeyboardEvent && event.isComposing) return;
    close();
  };
  function close(): void {
    (isOpen = false), targetRef.detach();
  }

  let unregister: () => void;
  onMount(() => {
    unregister = Register(
      scope,
      [
        [[], "Enter", select],
        [[], "Tab", select],
        [[], "Escape", close],
        [["Shift"], "Tab", select],
        [["Shift"], "Enter", select],
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
</script>

{#if isOpen}
  <SuggestionContainer on:click={select} bind:current={chosen} input={currentWord} />
  <div>
    {lineWOTrigger} , {currentWord}
  </div>
{/if}
