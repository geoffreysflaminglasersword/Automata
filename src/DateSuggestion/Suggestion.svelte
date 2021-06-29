<script lang="ts">
  import { BlockCache, CacheItem, Editor, Pos, SectionCache, TFile, Workspace, Loc } from "obsidian";
  import { App, Plugin, Scope, CM_Map, settings, onMount, onDestroy } from "common";
  import { setContext, Register, isNullOrWhitespace, RX, regexIndexOf, G_CTX } from "common";
  import FlatPickr from "./FlatPickr.svelte";
  import SuggestionContainer from "./SuggestionContainer.svelte";
  import { SectionUtils, fromLoc, Options } from "Utils";
  import { PartialTask, Task } from "Task";

  // State
  export let targetRef: HTMLElement;

  $: ({ SApp, SEditor, SWorkspace, plugin } = G_CTX);
  $: console.log("Here: ", plugin, G_CTX.plugin);
  let scope = new Scope();

  // Validation
  $: if (!$SEditor) throw new Error("in suggestion: editor must always exist");

  // Settings
  $: ({ insertDatesModifier: insertMod, autocompleteTriggerPhrase: trigger, includeSubsectionsTrigger } = $settings);

  // Declarations

  let active: TFile;
  let [isOpen, isSingleCursor, chosen] = [false, true, ""];
  let task: PartialTask,
    selectedDates: Date[] = [];

  // Reactive Declarations
  $: cursor = $SEditor.getCursor();
  $: lineNo = cursor.line;
  $: line = $SEditor.getLine(cursor.line);
  $: triggerPos = regexIndexOf(line, RX.getFirstAtSign, 0);
  $: foundTrigger = triggerPos >= 0;
  $: shouldOpen = isSingleCursor && foundTrigger && !document.querySelector(".suggestion-container");
  $: shouldClose = !foundTrigger || cursor.ch <= triggerPos;

  $: content = line.replace(new RegExp(".*" + trigger), "");
  $: excess = line.length - content.length;
  $: currentWord = content.substring(0, cursor.ch - excess).match(RX.rxLastWordOrSpace)[0];

  // Reactive Logic
  $: if (shouldClose) close();
  else if (shouldOpen) {
    isOpen = true;
    active = $SWorkspace.getActiveFile();
  }
  $: if (!shouldClose && shouldOpen) $SEditor.addWidget(cursor, targetRef, true);

  // Handlers
  function update(cm: CodeMirror.Editor, change: CodeMirror.EditorChange) {
    if ($SEditor !== cm) close();
    ($SEditor = cm), (isSingleCursor = change.text.length == 1);
  }
  function onCursorMove(cm: CodeMirror.Editor) {
    if ($SEditor !== cm) close();
    ($SEditor = cm), (cursor = $SEditor.getCursor());
  }
  function close(): void {
    (isOpen = false), (selectedDates = []), targetRef.detach();
  }
  function select(event: KeyboardEvent | MouseEvent) {
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
  }

  let unregister: () => void;
  onDestroy(() => unregister());
  onMount(() => {
    task = new PartialTask(line);
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

  // Helpers

  function autoCompleteReplace() {
    let { start, end, string: token } = $SEditor.getTokenAt(cursor);
    let idx = token.lastIndexOf(trigger);
    start += idx == -1 ? 0 : idx + trigger.length;
    $SEditor.replaceRange(chosen, { line: lineNo, ch: start }, { line: lineNo, ch: end });
  }

  async function createTask() {
    // $globalContext.taskIndex += 1;

    let titleContent: string,
      taskContent: string,
      blockId = "task-" + 1; //$globalContext.taskIndex;

    // FUTURE: this removes existing block references, we should probably update instead
    const cleanMarkDownLine = line.match(RX.cleanMarkdown)?.first() ?? "",
      cleanLineNoHash = cleanMarkDownLine.replace(/#/gm, "").trim(),
      includeSubsections = !!line.match(includeSubsectionsTrigger)?.length,
      headingSearchLevel = line.match(RX.hashPrecedingAt)?.length,
      SU = new SectionUtils($SEditor, $SApp.metadataCache.getFileCache(active).sections),
      section = SU.getSectionFromPos(cursor);

    let start = fromLoc(section.position.start),
      end = fromLoc(section.position.end);

    $SEditor.replaceRange(cleanMarkDownLine + " ^" + blockId, { line: lineNo, ch: 0 }, { line: lineNo, ch: Infinity });

    if (includeSubsections) end = SU.getSubSectionsEnd(section);

    taskContent = includeSubsections
      ? $SEditor.getRange(start, end).replace(RX.blockRefs, "")
      : "![[" + active.basename + "#^" + blockId + "]]";

    if (headingSearchLevel) {
      ({ start, end } = SU.getHeadingPos(headingSearchLevel, section));
      titleContent = $SEditor.getRange(start, end);
    } else titleContent = cleanLineNoHash;

    titleContent = RX.cleanHeading(titleContent);

    let t = new Task(taskContent, titleContent, line, task);

    close();
  }

  function updatePreview(e: CustomEvent) {
    if (!isOpen) return;
    task.refresh(line, selectedDates);
    e.detail.update({
      showMonths: Math.min(task.getMonthSpan() + 1, 3),
      disable: task.disabled(),
      defaultDate: task.enabled(),
    } as Options);
  }
</script>

{#if isOpen}
  <FlatPickr bind:selectedDates container={targetRef} on:preview={updatePreview} />
  <SuggestionContainer on:click={select} bind:current={chosen} input={currentWord} {scope} />
{/if}
