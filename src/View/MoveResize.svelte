<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let sensor: any;
  export let width: number;
  export let height: number;
  export let left: number;
  export let top: number;
  export let resizable: boolean;
  export let draggable: boolean;
  export let id: any;
  export let container: any;
  export let xPerPx: any;
  export let yPerPx: any;
  export let gapX: number;
  export let gapY: number;
  export let item: any;
  export let max: any;
  export let min: any;
  export let cols: number;
  export let nativeContainer: any;
  let shadowElement: any;
  let shadow: any = {};
  let active = false;
  let initX: number, initY: number;
  let capturePos = {
    x: 0,
    y: 0,
  };
  
  let cordDiff = { x: 0, y: 0 };
  let newSize:any = { width, height };
  let trans = false;
  let anima: any;

  const inActivate = () => {
    const shadowBound = shadowElement.getBoundingClientRect();
    const xdragBound = rect.left + cordDiff.x;
    const ydragBound = rect.top + cordDiff.y;
    cordDiff.x = shadow.x * xPerPx + gapX - (shadowBound.x - xdragBound);
    cordDiff.y = shadow.y * yPerPx + gapY - (shadowBound.y - ydragBound);
    active = false;
    trans = true;
    clearTimeout(anima);
    anima = setTimeout(() => {
      trans = false;
    }, 100);
    dispatch("pointerup", {
      id,
    });
  };
  let repaint = (cb:any, isPointerUp:any) => {
    dispatch("repaint", {
      id,
      shadow,
      isPointerUp,
      onUpdate: cb,
    });
  };
  // Autoscroll
  let _scrollTop = 0;
  let containerFrame:any;
  let rect:any;
  let scrollElement:any;
  const getContainerFrame = (element:any) => {
    if (element === document.documentElement || !element) {
      const { height, top, right, bottom, left } = nativeContainer.getBoundingClientRect();
      return {
        top: Math.max(0, top),
        bottom: Math.min(window.innerHeight, bottom),
      };
    }
    return element.getBoundingClientRect();
  };
  const getScroller = (element:any) => (!element ? document.documentElement : element);
  const pointerdown = ({ clientX, clientY, target }:any) => {
    initX = clientX;
    initY = clientY;
    capturePos = { x: left, y: top };
    shadow = { x: item.x, y: item.y, w: item.w, h: item.h };
    newSize = { width, height };
    containerFrame = getContainerFrame(container);
    scrollElement = getScroller(container);
    cordDiff = { x: 0, y: 0 };
    rect = target.closest(".svlt-grid-item").getBoundingClientRect();
    active = true;
    trans = false;
    _scrollTop = scrollElement.scrollTop;
    window.addEventListener("pointermove", pointermove);
    window.addEventListener("pointerup", pointerup);
  };
  let sign = { x: 0, y: 0 };
  let vel = { x: 0, y: 0 };
  let intervalId:any = 0;
  const stopAutoscroll = () => {
    clearInterval(intervalId);
    intervalId = false;
    sign = { x: 0, y: 0 };
    vel = { x: 0, y: 0 };
  };
  const update = () => {
    const _newScrollTop = scrollElement.scrollTop - _scrollTop;
    const boundX = capturePos.x + cordDiff.x;
    const boundY = capturePos.y + (cordDiff.y + _newScrollTop);
    let gridX = Math.round(boundX / xPerPx);
    let gridY = Math.round(boundY / yPerPx);
    shadow.x = Math.max(Math.min(gridX, cols - shadow.w), 0);
    shadow.y = Math.max(gridY, 0);
    if (max.y) {
      shadow.y = Math.min(shadow.y, max.y);
    }
    repaint();
  };
  const pointermove = (event:any) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const { clientX, clientY } = event;
    cordDiff = { x: clientX - initX, y: clientY - initY };
    const Y_SENSOR = sensor;
    let velocityTop = Math.max(0, (containerFrame.top + Y_SENSOR - clientY) / Y_SENSOR);
    let velocityBottom = Math.max(0, (clientY - (containerFrame.bottom - Y_SENSOR)) / Y_SENSOR);
    const topSensor = velocityTop > 0 && velocityBottom === 0;
    const bottomSensor = velocityBottom > 0 && velocityTop === 0;
    sign.y = topSensor ? -1 : bottomSensor ? 1 : 0;
    vel.y = sign.y === -1 ? velocityTop : velocityBottom;
    if (vel.y > 0) {
      if (!intervalId) {
        // Start scrolling
        // TODO Use requestAnimationFrame
        intervalId = setInterval(() => {
          scrollElement.scrollTop += 2 * (vel.y + Math.sign(vel.y)) * sign.y;
          update();
        }, 10);
      }
    } else if (intervalId) {
      stopAutoscroll();
    } else {
      update();
    }
  };
  const pointerup = (e:any) => {
    stopAutoscroll();
    window.removeEventListener("pointerdown", pointerdown);
    window.removeEventListener("pointermove", pointermove);
    window.removeEventListener("pointerup", pointerup);
    repaint(inActivate, true);
  };
  // Resize
  let resizeInitPos = { x: 0, y: 0 };
  let initSize = { width: 0, height: 0 };
  const resizePointerDown = (e:any) => {
    e.stopPropagation();
    const { pageX, pageY } = e;
    resizeInitPos = { x: pageX, y: pageY };
    initSize = { width, height };
    cordDiff = { x: 0, y: 0 };
    rect = e.target.closest(".svlt-grid-item").getBoundingClientRect();
    newSize = { width, height };
    active = true;
    trans = false;
    shadow = { x: item.x, y: item.y, w: item.w, h: item.h };
    containerFrame = getContainerFrame(container);
    scrollElement = getScroller(container);
    window.addEventListener("pointermove", resizePointerMove);
    window.addEventListener("pointerup", resizePointerUp);
  };
  const resizePointerMove = ({ pageX, pageY }:any) => {
    newSize.width = initSize.width + pageX - resizeInitPos.x;
    newSize.height = initSize.height + pageY - resizeInitPos.y;
    // Get max col number
    let maxWidth = cols - shadow.x;
    maxWidth = Math.min(max.w, maxWidth) || maxWidth;
    // Limit bound
    newSize.width = Math.max(Math.min(newSize.width, maxWidth * xPerPx - gapX * 2), min.w * xPerPx - gapX * 2);
    newSize.height = Math.max(newSize.height, min.h * yPerPx - gapY * 2);
    if (max.h) {
      newSize.height = Math.min(newSize.height, max.h * yPerPx - gapY * 2);
    }
    // Limit col & row
    shadow.w = Math.round((newSize.width + gapX * 2) / xPerPx);
    shadow.h = Math.round((newSize.height + gapY * 2) / yPerPx);
    repaint();
  };
  const resizePointerUp = (e:any) => {
    e.stopPropagation();
    repaint(inActivate, true);
    window.removeEventListener("pointermove", resizePointerMove);
    window.removeEventListener("pointerup", resizePointerUp);
  };
</script>

<div
  draggable={false}
  on:pointerdown={item && item.customDragger ? null : draggable && pointerdown}
  class="svlt-grid-item"
  class:svlt-grid-active={active || (trans && rect)}
  style="width: {active ? newSize.width : width}px; height:{active ? newSize.height : height}px; 
{active
    ? `transform: translate(${cordDiff.x}px, ${cordDiff.y}px);top:${rect.top}px;left:${rect.left}px;`
    : trans
    ? `transform: translate(${cordDiff.x}px, ${cordDiff.y}px); position:absolute; transition: width 0.2s, height 0.2s;`
    : `transition: transform 0.2s, opacity 0.2s; transform: translate(${left}px, ${top}px); `} "
>
  <slot movePointerDown={pointerdown} {resizePointerDown} />
  {#if resizable && !item.customResizer}
    <div class="svlt-grid-resizer" on:pointerdown={resizePointerDown} />
  {/if}
</div>

{#if active || trans}
  <div
    class="svlt-grid-shadow shadow-active"
    style="width: {shadow.w * xPerPx - gapX * 2}px; height: {shadow.h * yPerPx - gapY * 2}px; transform: translate({shadow.x * xPerPx +
      gapX}px, {shadow.y * yPerPx + gapY}px); "
    bind:this={shadowElement}
  />
{/if}

<style>
  .svlt-grid-item {
    touch-action: none;
    position: absolute;
    will-change: auto;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .svlt-grid-resizer {
    user-select: none;
    width: 20px;
    height: 20px;
    position: absolute;
    right: 0;
    bottom: 0;
    cursor: se-resize;
  }
  .svlt-grid-resizer::after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 5px;
    height: 5px;
    border-right: 2px solid rgba(0, 0, 0, 0.4);
    border-bottom: 2px solid rgba(0, 0, 0, 0.4);
  }
  .svlt-grid-active {
    z-index: 3;
    cursor: grabbing;
    position: fixed;
    opacity: 0.5;
    /*No user*/
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    -o-backface-visibility: hidden;
    -ms-backface-visibility: hidden;
    user-select: none;
  }
  .shadow-active {
    z-index: 2;
    transition: all 0.2s;
  }
  .svlt-grid-shadow {
    position: absolute;
    background: red;
    will-change: transform;
    background: pink;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
</style>
