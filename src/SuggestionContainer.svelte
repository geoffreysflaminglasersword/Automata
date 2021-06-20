<script lang="ts">
  import SuggestionItem from "./SuggestionItem.svelte";
  import { wrap } from "./Utils";
  import { onMount, onDestroy, getContext, Keys, SuggestionCtx, Register, isNullOrWhitespace } from "./common";
  import { matchSorter } from "match-sorter";
  import {
    GetLikely,
    ALL_KEYWORDS,
    ALL_QUANTIFIERS,
    ALL_CLAUSES,
    RELATIVE,
    ALT_CLAUSES,
    RECURRANCES,
  } from "./Scheduling/Clause";

  export let input: string, current: string;
  $: likely = GetLikely(input); //TODO: add multi-word suggestions and make top 2 results based on MRU
  $: suggestions = matchSorter(likely, isNullOrWhitespace(input) ? "" : input).slice(0, 10); //getDateSuggestions(input);
  $: current = suggestions[current_index];

  let { app, plugin, scope, editor } = getContext<SuggestionCtx>(Keys.suggestion);
  let current_index: number = 0;

  onMount(() => {
    editor.addKeyMap(disableTab);
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
    editor.removeKeyMap(disableTab);
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

  function getDateSuggestions(inputStr: string): string[] {
    if (inputStr.match(/(next|last|this)/i)) {
      const reference = inputStr.match(/(next|last|this)/i)[1];
      return ["week", "month", "year", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        .map((val) => `${reference} ${val}`)
        .filter((items) => items.toLowerCase().startsWith(inputStr));
    }

    const relativeDate = inputStr.match(/^in ([+-]?\d+)/i) || inputStr.match(/^([+-]?\d+)/i);
    if (relativeDate) {
      const timeDelta = relativeDate[1];
      return [
        `in ${timeDelta} minutes`,
        `in ${timeDelta} hours`,
        `in ${timeDelta} days`,
        `in ${timeDelta} weeks`,
        `in ${timeDelta} months`,
        `${timeDelta} days ago`,
        `${timeDelta} weeks ago`,
        `${timeDelta} months ago`,
      ].filter((items) => items.toLowerCase().startsWith(inputStr));
    }

    return ["Today", "Yesterday", "Tomorrow"].filter((items) => items.toLowerCase().startsWith(inputStr));
  }
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
    <span class="prompt-instruction-command">Shift</span>
    <span>Keep text as alias</span>
  </div>
</div>
