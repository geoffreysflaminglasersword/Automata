<script lang="ts">
  // Exports
  export let app: App, plugin: Plugin, targetRef: HTMLElement, editor: CodeMirror.Editor;

  // Validation
  $: if (!editor) throw new Error("in suggestion: editor must always exist");

  // Settings
  $: insertMod = $settings.insertDatesModifier;
  $: trigger = $settings.autocompleteTriggerPhrase;

  // Declarations
  let active: TFile, finalized: string;
  let [isOpen, isSingleCursor, chosen, scope, blockId] = [false, true, "", new Scope(), ""];
  setContext(Keys.suggestion, { app, plugin, scope, editor });

  // Reactive Declarations
  $: cursor = editor.getCursor();
  $: lineNo = cursor.line;
  $: line = editor.getLine(lineNo);
  $: triggerPos = regexIndexOf(line, new RegExp(trigger), 0);
  $: foundTrigger = triggerPos >= 0;
  $: shouldOpen = isSingleCursor && foundTrigger && !document.querySelector(".suggestion-container");
  $: shouldClose = !foundTrigger || cursor.ch <= triggerPos;

  $: content = line.replace(new RegExp(".*" + trigger), "");
  $: excess = line.length - content.length;
  $: currentWord = content.substring(0, cursor.ch - excess).match(rxLastWordOrSpace)[0];

  // Reactive Logic
  $: if (shouldClose) close();
  else if (shouldOpen) {
    isOpen = true;
    active = app.workspace.getActiveFile();
  }
  $: if (!shouldClose && shouldOpen) editor.addWidget(cursor, targetRef, true);

  // Handlers
  function update(cm: CodeMirror.Editor, change: CodeMirror.EditorChange) {
    if (editor !== cm) close();
    (editor = cm), (isSingleCursor = change.text.length == 1);
  }
  function onCursorMove(cm: CodeMirror.Editor) {
    if (editor !== cm) close();
    (editor = cm), (cursor = editor.getCursor());
  }
  function close(): void {
    (isOpen = false), targetRef.detach();
  }
  let select = (event: KeyboardEvent | MouseEvent) => {
    if (!isOpen) return;
    let isConfirmation = false,
      blank = isNullOrWhitespace(chosen),
      heldModifier = event[CM_Map[insertMod]];

    if (event instanceof KeyboardEvent)
      if (event.isComposing || (event.key == "Tab" && blank)) return;
      else if (event.key == "Enter") isConfirmation = true;

    if (heldModifier) {
      if (event instanceof MouseEvent || isConfirmation) () => {}; /* TODO: insert links to dates */
    } else {
      if (isConfirmation) createTask();
      else if (!blank) autoCompleteReplace();
    }
  };

  let unregister: () => void;
  onDestroy(() => unregister());
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

  function autoCompleteReplace() {
    let { start, end, string: token } = editor.getTokenAt(cursor);
    let idx = token.indexOf(trigger);
    start += idx == -1 ? 0 : idx + trigger.length;
    editor.replaceRange(chosen, { line: lineNo, ch: start }, { line: lineNo, ch: end });
  }

  function createTask() {
    let current = editor.getLine(lineNo).replace(/ \^.*/gm, ""); // FUTURE: this just removes the existing block reference, we should probably update instead
    blockId = "task-" + $globalContext.taskIndex;
    $globalContext.taskIndex += 1;
    let s = regexIndexOf(current, /(?:.(?!@))+$/m, 0);
    editor.replaceRange(" ^" + blockId, { line: lineNo, ch: s }, { line: lineNo, ch: Infinity });

    let t = new Rule(current);
    t.print();
    finalized = t.originalString;
    app.metadataCache.on("changed", finish); // have to wait for file indexing to get updated sections
  }

  async function finish(file: TFile) {
    let text = await app.vault.read(active);

    let { blocks, sections } = app.metadataCache.getFileCache(active);
    let idx: number;
    console.log(blocks, sections, blockId);
    let { position, type, id } = sections.find((v, i) => {
      idx = i;
      return v.id == blockId;
    });

    let start = position.start.offset,
      end = position.end.offset;
    let getTitleContent = (start: number, end: number) =>
      text.slice(start, end).replace(/(?:#+\s)?\s?(.*) \^.*/gm, "$1");
    let titleContent: string;

    if (type != "heading") {
      sections.find((s, i) => {
        console.log("i:", i);
        if (i == idx) return true;
        if (s.type == "heading") titleContent = getTitleContent(s.position.start.offset, s.position.end.offset);
        console.log("i:", i, s.type, titleContent);
        return false;
      });
    } else titleContent = getTitleContent(start, end);
    console.log(titleContent);

    for (idx++; idx < sections.length; idx++) {
      console.log("HERE 1");

      if (!isEqualOrGreater(sections[idx].type, type)) continue;
      end = sections[idx].position.start.offset;
      break;
    }
    let taskContent = text.slice(start, end).replace(/\^\S+\s/gm, "");
    console.log(titleContent, "\n\n", taskContent);
    if (!titleContent || titleContent == taskContent) titleContent = finalized;
    console.log(titleContent);
    console.log(taskContent);
    app.metadataCache.off("changed", finish);
  }

  type SectionType = "list" | "code" | "paragraph" | "heading";

  function isEqualOrGreater(type: string, type2: string) {
    switch (<SectionType>type) {
      case "heading":
        return true;
      default:
        return type == type2;
    }
  }

  import { BlockCache, Editor, SectionCache, TFile, Workspace } from "obsidian";

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
    globalContext,
    get,
  } from "./common";
  import Rule from "./Scheduling/Rule";
  import SuggestionContainer from "./SuggestionContainer.svelte";
  import { regexIndexOf, rxLastWordOrSpace } from "./Utils";
</script>

{#if isOpen}
  <SuggestionContainer on:click={select} bind:current={chosen} input={currentWord} />
  <!-- <div>
    {lineWOTrigger} , {currentWord}
  </div> -->
{/if}
