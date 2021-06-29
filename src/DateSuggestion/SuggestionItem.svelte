<script lang="ts">
  export let suggestion: string, index: number, current_index: number;
  let div: HTMLDivElement;
  let hovered = false;
  $: if (div && current_index === index) div.scrollIntoView({ behavior: "smooth", block: "nearest" });
</script>

<div
  on:click|preventDefault
  on:mouseenter={() => {
    current_index = index;
    hovered = true;
  }}
  on:mouseleave={() => (hovered = false)}
  class="suggestion-item {current_index === index ? 'is-selected' : ''}"
  bind:this={div}
>
  {suggestion}
</div>
