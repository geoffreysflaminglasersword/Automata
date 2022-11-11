<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { getContainerHeight, getItemById, moveItem, moveItemsAroundItem, specifyUndefinedColumns } from "./GridHelp";
  import MoveResize from "./MoveResize.svelte";

  type Cols = number;
  type MinWidthPxForTargetCoumn = number;

  const dispatch = createEventDispatcher();
  export let items: Array<any>;
  export let cols: Array<[MinWidthPxForTargetCoumn,Cols]>;
  export let gap: Array<number> = [10, 10];
  export let rowHeight: number;
  export let throttleUpdate: number = 100;
  export let throttleResize: number = 100;
  export let fastStart: boolean = false;
  export let fillSpace: boolean = false;
  export let sensor: number = 20;
  export let scroller: Element = undefined;

  // =============================================================================

  function throttle(func: any, timeFrame: any) {
    let lastTime: any = 0;
    return function (...args: any) {
      let now = Date.now();
      if (now - lastTime >= timeFrame) {
        func(...args);
        lastTime = now;
      }
    };
  }

  const getColumn = (containerWidth: any, columns: any) => {
    const sortColumns = columns.slice().sort((a: any, b: any) => a[0] - b[0]);

    const breakpoint = sortColumns.find((value: any) => {
      const [width] = value;
      return containerWidth <= width;
    });

    if (breakpoint) {
      return breakpoint[1];
    } else {
      return sortColumns[sortColumns.length - 1][1];
    }
  };
  // ======================================================

  let getComputedCols: any;
  let container: any;
  $: [gapX, gapY] = gap;
  let xPerPx = 0;
  let yPerPx = rowHeight;
  let documentWidth: any;
  let containerWidth: any;
  $: containerHeight = getContainerHeight(items, yPerPx, getComputedCols);
  const pointerup = (ev: any) => {
    dispatch("pointerup", {
      id: ev.detail.id,
      cols: getComputedCols,
    });
  };
  const onResize = throttle(() => {
    items = specifyUndefinedColumns(items, getComputedCols, cols);
    dispatch("resize", {
      cols: getComputedCols,
      xPerPx,
      yPerPx,
      width: containerWidth,
    });
  }, throttleUpdate);
  onMount(() => {
    const sizeObserver = new ResizeObserver((entries) => {
      let width = entries[0].contentRect.width;
      if (width === containerWidth) return;
      getComputedCols = getColumn(width, cols);
      xPerPx = width / getComputedCols;
      if (!containerWidth) {
        items = specifyUndefinedColumns(items, getComputedCols, cols);
        dispatch("mount", {
          cols: getComputedCols,
          xPerPx,
          yPerPx, // same as rowHeight
        });
      } else {
        onResize();
      }
      containerWidth = width;
    });
    sizeObserver.observe(container);
    return () => sizeObserver.disconnect();
  });
  const updateMatrix = ({ detail }: any) => {
    let activeItem = getItemById(detail.id, items);
    if (activeItem) {
      activeItem = {
        ...activeItem,
        [getComputedCols]: {
          ...activeItem[getComputedCols],
          ...detail.shadow,
        },
      };
      if (fillSpace) {
        items = moveItemsAroundItem(activeItem, items, getComputedCols, getItemById(detail.id, items));
      } else {
        items = moveItem(activeItem, items, getComputedCols, getItemById(detail.id, items));
      }
      if (detail.onUpdate) detail.onUpdate();
      dispatch("change", {
        unsafeItem: activeItem,
        id: activeItem.id,
        cols: getComputedCols,
      });
    }
  };
  const throttleMatrix = throttle(updateMatrix, throttleResize);
  const handleRepaint = ({ detail }: any) => {
    if (!detail.isPointerUp) {
      throttleMatrix({ detail });
    } else {
      updateMatrix({ detail });
    }
  };
</script>

<div class="svlt-grid-container" style="height: {containerHeight}px" bind:this={container}>
  {#if xPerPx || !fastStart}
    {#each items as item, i (item.id)}
      <MoveResize
        on:repaint={handleRepaint}
        on:pointerup={pointerup}
        id={item.id}
        resizable={item[getComputedCols] && item[getComputedCols].resizable}
        draggable={item[getComputedCols] && item[getComputedCols].draggable}
        {xPerPx}
        {yPerPx}
        width={Math.min(getComputedCols, item[getComputedCols] && item[getComputedCols].w) * xPerPx - gapX * 2}
        height={(item[getComputedCols] && item[getComputedCols].h) * yPerPx - gapY * 2}
        top={(item[getComputedCols] && item[getComputedCols].y) * yPerPx + gapY}
        left={(item[getComputedCols] && item[getComputedCols].x) * xPerPx + gapX}
        item={item[getComputedCols]}
        min={item[getComputedCols] && item[getComputedCols].min}
        max={item[getComputedCols] && item[getComputedCols].max}
        cols={getComputedCols}
        {gapX}
        {gapY}
        {sensor}
        container={scroller}
        nativeContainer={container}
        let:resizePointerDown
        let:movePointerDown
      >
        {#if item[getComputedCols]}
          <slot {movePointerDown} {resizePointerDown} dataItem={item} item={item[getComputedCols]} index={i} />
        {/if}
      </MoveResize>
    {/each}
  {/if}
</div>

<style>
  .svlt-grid-container {
    position: relative;
    width: 100%;
  }
</style>
