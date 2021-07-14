<script lang="ts">
  import SuggestionItem from "./SuggestionItem.svelte";
  import { wrap, getUniqueArray } from "Utils";
  import { Scope, settings, onMount, onDestroy, getContext, Register, isNullOrWhitespace, Global } from "common";
  import { matchSorter } from "match-sorter";
  import { GetLikely } from "Scheduling/Clause";

  export let input: string, current: string, scope: Scope;
  $: likely = GetLikely(input); //TODO: add multi-word suggestions and make top 2 results based on MRU
  $: sortKey = isNullOrWhitespace(input) ? "" : input;
  $: firstChar = sortKey ? sortKey.charAt(0) : "";
  // sometimes matchSorter only returns 1 or a few matches, so we fill up the remaining with matches based on the first char (this isn't efficient but good enough for now considering the small dataset)
  $: suggestions = matchSorter(likely, sortKey);
  $: if (suggestions && sortKey) suggestions = suggestions.slice(0, 7);
  $: if (suggestions.length < 3)
    suggestions = getUniqueArray([...suggestions, ...matchSorter(likely, firstChar)]).slice(0, 7);
  $: current = suggestions[current_index];

  let { app, SEditor, plugin } = Global;
  let current_index: number = 0;

  onMount(() => {
    $SEditor.addKeyMap(disableTab);
    unregister = Register(
      scope,
      [
        [[], "ArrowUp", up],
        [[], "ArrowDown", down],
      ],
      plugin,
      [["keyHandled", () => (current_index = 0)]]
    );
    (<any>app).keymap.pushScope(scope);
  });
  onDestroy(() => {
    $SEditor.removeKeyMap(disableTab);
    unregister();
    (<any>app).keymap.popScope(scope);
  });
  let unregister: () => void;
  const disableTab = { Tab: (cm: CodeMirror.Editor) => cm.replaceSelection(" ", "end") };

  let up = (event: KeyboardEvent) => nav(-1, event);
  let down = (event: KeyboardEvent) => nav(1, event);
  let nav = (add: number, event: KeyboardEvent) => {
    if (!event.isComposing) {
      current_index = wrap(current_index + add, suggestions.length);
      return false;
    }
  };
</script>

<div class="suggestion">
  {#if suggestions.length}
    {#each suggestions as suggestion, index}
      <SuggestionItem bind:current_index on:click {suggestion} {index} />
    {/each}
  {:else}
    <SuggestionItem bind:current_index suggestion={input} index={0} />
  {/if}
</div>

<div class="prompt-instructions">
  <div class="prompt-instruction">
    <span>Hold</span>
    <span class="prompt-instruction-command">{$settings.insertDatesModifier}</span>
    <span>to insert here...</span>
  </div>
</div>
