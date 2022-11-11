<script lang="ts">
  import SCard from "./SCard.svelte";
  import { flip } from "svelte/animate";
  import { Lane, settings } from "./store";
  import { dndzone } from "svelte-dnd-action";
  import {c} from "Utils"


  export let laneArr: Lane[];
  export let lane: Lane;

  let finalizeCards = (cid: string, e: any) => considerCards(cid, e);
  function considerCards(cid: string, e: any) {
    const colIdx = laneArr.findIndex((c) => c.id === cid);
    laneArr[colIdx].cards = e.detail.items;
    laneArr = [...laneArr];
  }
</script>

<div class={c("lane")}>
  <div class="lane-title">{lane.title}</div>
  <div
  class={c("lane-content")}
  use:dndzone={{ items: lane.cards, flipDurationMs: $settings.flipDurationMs }}
  on:consider={(e) => considerCards(lane.id, e)}
  on:finalize={(e) => finalizeCards(lane.id, e)}
  >
  {#each lane.cards as card (card.id)}
  <div class={c('card')} animate:flip={{ duration: $settings.flipDurationMs }}>
    <!-- Unfortunately this div cannot be moved into the SCard component as it must be 
      directly below the 'each' in order to animate, and it must have the card class otherwise
      styling doesn't work properly (the same goes for the lane div in SBoard)-->
      <SCard {card} />
    </div>
    {/each}
  </div>
</div>


