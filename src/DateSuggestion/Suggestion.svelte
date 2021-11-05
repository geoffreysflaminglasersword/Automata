<script lang="ts">
  import { Scope, CM_Map, settings, onMount, onDestroy, TFile } from "common";
  import { Register, isNullOrWhitespace, RX, regexIndexOf, Global } from "common";
  import FlatPickr from "./FlatPickr.svelte";
  import SuggestionContainer from "./SuggestionContainer.svelte";
  import { SectionUtils, fromLoc, Options } from "Utils";
  import { PartialTask, Task } from "src/Task";

  // State
  let targetRef: HTMLElement;

  let { app, SEditor, SWorkspace, plugin, editor } = Global;
  let scope = new Scope();

  // Validation
  $: if (!editor) throw new Error("in suggestion: editor must always exist");
  console.log("Instantiated Suggestion 1", plugin);

  // Settings
  $: ({ insertDatesModifier: insertMod, autocompleteTriggerPhrase: trigger, includeSubsectionsTrigger } = $settings);

  // Declarations

  let active: TFile;
  let isOpen = false,
    isSingleCursor = true,
    chosen = "";
  let task: PartialTask,
    selectedDates: Date[] = [];

  // Reactive Declarations
  $: cursor = $SEditor.getCursor();
  $: lineNo = cursor.line;
  $: line = editor.getLine(cursor.line);
  $: triggerPos = regexIndexOf(line, RX.getFirstAtSign, 0);
  $: foundTrigger = triggerPos >= 0;
  $: shouldOpen = isSingleCursor && foundTrigger && !document.querySelector(".suggestion");
  $: shouldClose = !foundTrigger || cursor.ch <= Math.max(triggerPos, 0);

  $: content = line.replace(new RegExp(".*" + trigger), "");
  $: excess = line.length - content.length;
  $: currentWord = content.substring(0, cursor.ch - excess).match(RX.rxLastWordOrSpace)[0];

  // Reactive Logic
  $: if (shouldClose && isOpen) close();
  else if (shouldOpen) open();
  $: if (!shouldClose && shouldOpen) editor.addWidget(cursor, targetRef, true);

  // Handlers
  function update(cm: CodeMirror.Editor, change: CodeMirror.EditorChange) {
    console.log("Btiches");
    if (editor !== cm) close();
    (editor = cm), (isSingleCursor = change.text.length == 1);
  }
  function onCursorMove(cm: CodeMirror.Editor) {
    // console.log("asdffdsa", cm == editor, cm === editor);
    if (editor !== cm) close();
    (editor = cm), (cursor = editor.getCursor());
  }
  function open() {
    console.log("CALLED OPEN");
    isOpen = true;
    active = $SWorkspace.getActiveFile();
  }
  function close(): void {
    console.log("CALLED CLOSE");
    (isOpen = false), (selectedDates = []), targetRef.detach();
    // (escaped = true), (isOpen = false), (selectedDates = []), targetRef.detach();
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
    console.log(`isOpen:Select: `, isOpen);
  }

  let unregister: () => void;
  onDestroy(() => unregister());
  onMount(() => {
    console.log("Instantiated Suggestion 2: ", isOpen, cursor, shouldClose, shouldOpen);
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
    let { start, end, string: token } = editor.getTokenAt(cursor);
    let idx = token.lastIndexOf(trigger);
    start += idx == -1 ? 0 : idx + trigger.length;
    editor.replaceRange(chosen, { line: lineNo, ch: start }, { line: lineNo, ch: end });
  }

  async function createTask() {
    let titleContent: string,
      taskContent: string,
      blockId = "task-" + 1; //$globalContext.taskIndex;

    // FUTURE: this removes existing block references, we should probably update instead
    const cleanMarkDownLine = line.match(RX.cleanMarkdown)?.first() ?? "",
      cleanLineNoHash = cleanMarkDownLine.replace(/#/gm, "").trim(),
      includeSubsections = !!line.match(includeSubsectionsTrigger)?.length,
      headingSearchLevel = line.match(RX.hashPrecedingAt)?.length,
      SU = new SectionUtils(editor, app.metadataCache.getFileCache(active).sections),
      section = SU.getSectionFromPos(cursor);

    let start = fromLoc(section.position.start),
      end = fromLoc(section.position.end);

    editor.replaceRange(cleanMarkDownLine, { line: lineNo, ch: 0 }, { line: lineNo, ch: cursor.ch });
    editor.replaceRange(" ^" + blockId, { line: lineNo, ch: Infinity });

    if (includeSubsections) end = SU.getSubSectionsEnd(section);

    taskContent = includeSubsections
      ? editor.getRange(start, end).replace(RX.blockRefs, "")
      : "![[" + active.basename + "#^" + blockId + "]]";

    if (headingSearchLevel) {
      ({ start, end } = SU.getHeadingPos(headingSearchLevel, section));
      titleContent = editor.getRange(start, end);
    } else titleContent = cleanLineNoHash;

    titleContent = RX.cleanHeading(titleContent);

    let t = new Task().fromPartial(taskContent, titleContent, line, task);
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

  // let OpenFunc: (cm: CodeMirror.Editor) => void = (cm) => cm.replaceSelection("\n");
  // let CloseFunc: (cm: CodeMirror.Editor) => void = (cm) =>
  //   console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWCaught Enter!");

  // $: {
  //   if (isOpen === true) {
  //     $SEditor.setOption("extraKeys", Object.assign($SEditor.getOption("extraKeys"), { Enter: OpenFunc }));
  //     console.log("Open change ", isOpen);
  //   }
  //   if (isOpen === false) {
  //     $SEditor.setOption("extraKeys", Object.assign($SEditor.getOption("extraKeys"), { Enter: CloseFunc }));
  //     console.log("close change ", isOpen);
  //   }
  // }
</script>

<div class="suggestion-container" bind:this={targetRef}>
  {#if isOpen}
    <FlatPickr bind:selectedDates container={targetRef} on:preview={updatePreview} />
    <SuggestionContainer on:click={select} bind:current={chosen} input={currentWord} {scope} />
  {/if}
</div>
