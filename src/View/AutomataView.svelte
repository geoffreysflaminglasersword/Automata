<!-- <script lang="ts">
    import {store} from './store';
    import Folder from './Folder.svelte'
    import SBoard from './SBoard.svelte'
import File from "./File.svelte";
import { __values } from "tslib";
import {c} from "Utils"

    
    $: console.log($store)
;
</script>
<div class="automata-view">
    <div>
      Testing, testing, 1, 2, 3...
    </div>
    
    <SBoard bind:laneArr={$store}/>

</div> -->

<script lang="ts">
  import Grid from "./Grid.svelte";
  import { gridHelp } from "./GridHelp";

  const id = () => "_" + Math.random().toString(36).substr(2, 9);

  const randomHexColorCode = () => {
    let n = (Math.random() * 0xfffff * 1000000).toString(16);
    return "#" + n.slice(0, 6);
  };

  let num_columns = 16;
  function generateLayout(col) {
    return new Array(10).fill(null).map(function (item, i) {
      const y = Math.ceil(Math.random() * 4) + 1;
      return {
        16: gridHelp.item({ x: (i * 2) % col, y: Math.floor(i / 6) * y, w: 2, h: y }),
        id: id(),
        data: { start: randomHexColorCode(), end: randomHexColorCode() },
      };
    });
  }
  let cols = [[1287, num_columns]];
  let items = gridHelp.adjust(generateLayout(num_columns), num_columns);
</script>

<Grid bind:items {cols} rowHeight={100} let:dataItem fillSpace={true}>
  <div class="content" style="background-image: linear-gradient({dataItem.data.start}, {dataItem.data.end});" />
</Grid>

<style>
  .content {
    width: 100%;
    height: 100%;
    border-radius: 6px;
  }
  :global(body) {
    overflow-y: scroll;
  }
  :global(.svlt-grid-resizer::after) {
    border-color: white !important;
  }
  :global(.svlt-grid-shadow) {
    border-radius: 6px;
  }
  :global(.svlt-grid-item) {
    border-radius: 6px;
  }
</style>
