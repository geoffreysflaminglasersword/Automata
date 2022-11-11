<script lang="ts">
  import { flip } from "svelte/animate";
  import { dndzone } from "svelte-dnd-action";
  import { Lane, settings } from "./store";
  import Slane from "./SLane.svelte";
  import { c } from "Utils";
  import cc from "classcat";
  import {resize} from "./AResize"

  export let laneArr: Lane[];

  // let considerCols = (e:any) => {lanes = e.detail.items;}
  function considerCols(e) {
    laneArr = e.detail.items;
  }
  let finalizeCols = (e: any) => considerCols(e);

</script>



<section
  class={c("board b")}
  use:dndzone={{ items: laneArr, flipDurationMs: $settings.flipDurationMs, type: "columns" }}
  on:consider={considerCols}
  on:finalize={finalizeCols}
>
  {#each laneArr as lane, idx (lane.id)}
    <div class={c("lane-wrapper")} animate:flip={{ duration: $settings.flipDurationMs }} use:resize>
      <Slane bind:laneArr bind:lane />
    </div>
  {/each}
</section>

<style>
  .automata-view__lane-wrapper {
    background-color: green;
  }
  
  :global(.grabber) {
    user-select: none;
    width: 20px;
    height: 20px;
    position: absolute;
    right: 0;
    bottom: 0;
    cursor: se-resize;
    display: flex;
    justify-content:end;
    flex-flow: row nowrap;
    align-items:flex-end;
  }

  :global(.grabber::after) {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 5px;
    height: 5px;
    border-right: 2px solid rgba(0, 0, 0, 0.4);
    border-bottom: 2px solid rgba(0, 0, 0, 0.4);
    pointer-events: all;

  }
  
</style>


<!-- <main on:mousemove={onMove} on:mouseup={onMouseup} on:mousedown={onMousedown}>
  <div class="box" bind:this={element} >
    Box
    <div class="southeast grabber bottom-right"/>
  </div>
</main> -->
