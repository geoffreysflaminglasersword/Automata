<script>
  import {c} from 'Utils'


</script>

<div class={c("resizable-div .wrapper")} use:resize>
  <slot></slot>
</div>

<style>
  .wrapper {
    left: 300px;
    top: 100px;
    height: 100px;
    width: 100px;
    background: #e5e5e5;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    user-select: none;
    min-width: 100px;
    min-height: 100px;
  }



  .svlt-grid-resizer {
  }

  .svlt-grid-resizer::after {
  }
</style>
