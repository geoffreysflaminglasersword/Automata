<script lang="ts">
  export let file: { title: string; };

  $: type = file.title.slice(file.title.lastIndexOf(".") + 1);
</script>

<label>
  <span style="background-image: url(tutorial/icons/{type}.svg)" />
  <input bind:value={file.title} />
</label>

<style>
  span {
    padding: 0 0 0 1.5em;
    background: 0 0.1em no-repeat;
    background-size: 1em 1em;
  }
</style>
