<script lang="ts">
import { Card } from "./store";
import {c} from "Utils"

  function handleClick(e) {
    alert("dragabble elements are still clickable :)");
  }
  export let card:Card;
</script>


<div  on:click={handleClick}>
    <div class={c('cardTitle')}>
      {card.title}
    </div>
    <div class={c('cardContents')}>
      {card.contents}
    </div>
</div>



