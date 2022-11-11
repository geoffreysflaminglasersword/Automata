<script lang="ts">
  import File from "./File.svelte";

  export let readonly = false;
  export let expanded = false;

  export let file: { title: string };
  export let cards: any[];

  function toggle() {
    expanded = !expanded;
  }
</script>

{#if readonly}
  <button class:expanded on:click={toggle}>{file.title}</button>
{:else}
  <label>
    <button class:expanded on:click={toggle} />
    <input bind:value={file.title} />
  </label>
{/if}

{#if expanded}
  <ul>
    {#each cards as file}
      <li>
        {#if file.type === "folder"}
          <svelte:self bind:file bind:cards={file.cards} />
        {:else}
          <File bind:file />
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  button {
    padding: 0 0 0 1.5em;
    background-size: 1em 1em;
    font-weight: bold;
    cursor: pointer;
    min-height: 1em;
    display: inline-block;
  }

  .expanded {
    background-image: url(tutorial/icons/folder-open.svg);
  }

  ul {
    padding: 0.2em 0 0 0.5em;
    margin: 0 0 0 0.5em;
    list-style: none;
    border-left: 1px solid #eee;
  }

  li {
    padding: 0.2em 0;
  }
</style>
