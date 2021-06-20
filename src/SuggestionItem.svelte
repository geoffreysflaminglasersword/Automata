<script lang="ts">
  export let suggestion: string, index: number, current_index: number;
</script>

<div
  on:click|preventDefault
  on:mouseenter={() => (current_index = index)}
  tabindex="0"
  class="suggestion-item {current_index === index ? 'is-selected' : ''}"
>
  {suggestion}
</div>
