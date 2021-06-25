<script lang="ts">
  // Exports
  export let app: App, plugin: Plugin, targetRef: HTMLElement, editor: CodeMirror.Editor;

  // Validation
  $: if (!editor) throw new Error("in suggestion: editor must always exist");

  // Settings
  $: ({
    insertDatesModifier: insertMod,
    autocompleteTriggerPhrase: trigger,
    useHeadingAsTitle: useHeading,
    includeSubsectionsTrigger,
  } = $settings);

  // Declarations
  let active: TFile;
  let [isOpen, isSingleCursor, chosen, scope] = [false, true, "", new Scope()];
  setContext(Keys.suggestion, { app, plugin, scope, editor });

  // Reactive Declarations
  $: cursor = editor.getCursor();
  $: lineNo = cursor.line;
  $: line = editor.getLine(lineNo);
  $: triggerPos = regexIndexOf(line, /(@(?=@*\S))|@$/, 0);
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
    let idx = token.lastIndexOf(trigger);
    start += idx == -1 ? 0 : idx + trigger.length;
    editor.replaceRange(chosen, { line: lineNo, ch: start }, { line: lineNo, ch: end });
  }

  function fromLoc(input: Loc) {
    return <CodeMirror.Position>{ line: input.line, ch: input.col };
  }

  async function createTask() {
    $globalContext.taskIndex += 1;
    let blockId = "task-" + $globalContext.taskIndex;
    let includeSubsections = !!line.match(includeSubsectionsTrigger)?.length;
    let headingSearchLevel = line.match(/#(?=#*@)/g)?.length;
    let cleanMarkDownLine = line.match(/(?<!(?:@|\^).*)([^@^\n]+)\s/m)[0]; // FUTURE: this removes existing block references, we should probably update instead
    let cleanLineNoHash = cleanMarkDownLine.replace(/#/gm, "").trim();
    editor.replaceRange(cleanMarkDownLine + " ^" + blockId, { line: lineNo, ch: 0 }, { line: lineNo, ch: Infinity });

    let t = new Rule(line);
    t.print();

    let titleContent: string, taskContent: string;
    let sections = app.metadataCache.getFileCache(active).sections;
    let section = getSectionFromPos(cursor, sections),
      { position, id, type } = section,
      start = fromLoc(position.start),
      end = fromLoc(position.end);

    if (includeSubsections) end = getSubSectionsEnd(section, sections);

    taskContent = includeSubsections
      ? editor.getRange(start, end).replace(/\^\S+\s?/gm, "")
      : "![[" + active.basename + "#^" + blockId + "]]";

    if (useHeading) {
      ({ start, end } = getHeadingPos(headingSearchLevel, section, sections));
      titleContent = editor.getRange(start, end);
    } else titleContent = cleanLineNoHash;
    titleContent = titleContent
      .replace(/^#+\s/, "")
      .replace(/\s?\^\S+/, "")
      .replace(/@+.*[^\n]/, "");
    console.log(titleContent);
    console.log(taskContent);
  }

  let matchHeadingHashes = /(?<=^#*?)#(?=#*\s)/g;
  let sectionStart = (section: SectionCache) => editor.getLine(section.position.start.line);

  function getHeadingPos(level: number, section: SectionCache, source: TFile | SectionCache[]) {
    let res: SectionCache = section;
    let sections = source instanceof TFile ? app.metadataCache.getFileCache(source).sections : source;
    for (let sec of sections) {
      if (sec.position.start.offset > section.position.start.offset) break;
      else if (sec.type == "heading") {
        if (level) {
          let currentLevel = sectionStart(sec).match(matchHeadingHashes)?.length;
          if (currentLevel == level) res = sec;
        } else res = sec;
      }
    }

    return { start: fromLoc(res.position.start), end: fromLoc(res.position.end) };
  }

  function getSubSectionsEnd(section: SectionCache, source: TFile | SectionCache[]) {
    let sections = source instanceof TFile ? app.metadataCache.getFileCache(source).sections : source;
    let idx = sections.indexOf(section) + 2;
    let end = fromLoc(section.position.end);
    for (; idx < sections.length; idx++) {
      if (isGreaterSection(section, sections[idx])) continue;
      console.log(idx, section, sections[idx]);
      end = fromLoc(sections[idx].position.start);
      break;
    }
    return end;
  }

  function getSectionFromPos(position: CodeMirror.Position, source: TFile | SectionCache[]) {
    let sections = source instanceof TFile ? app.metadataCache.getFileCache(source).sections : source;

    for (let sec of sections) {
      let { position: pos, type, id } = sec;
      if (pos.start.line <= position.line && pos.end.line >= position.line) return sec;
    }
    throw new Error("in getSectionFromPos: tried to get section at invalid position");
    return null;
  }

  type SectionType = "list" | "code" | "paragraph" | "heading";

  function isGreaterSection(left: SectionCache, right: SectionCache) {
    let t1: SectionType = <SectionType>left.type;
    let t2: SectionType = <SectionType>right.type;
    let L1 = sectionStart(left).match(matchHeadingHashes)?.length,
      L2 = sectionStart(right).match(matchHeadingHashes)?.length;

    switch (t1) {
      case "heading":
        return t2 == "heading" ? L1 < L2 : true; // lower number of hashes means higher level
      default:
        return t1 == t2;
    }
  }

  import { BlockCache, CacheItem, Editor, Pos, SectionCache, TFile, Workspace, Loc } from "obsidian";

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
  import FlatPickr from "./FlatPickr.svelte";
  import Rule from "./Scheduling/Rule";
  import SuggestionContainer from "./SuggestionContainer.svelte";
  import { regexIndexOf, rxLastWordOrSpace } from "./Utils";
</script>

{#if isOpen}
  <FlatPickr container={targetRef} />
  <SuggestionContainer on:click={select} bind:current={chosen} input={currentWord} />
  <!-- <div>
    {lineWOTrigger} , {currentWord}
  </div> -->
{/if}
