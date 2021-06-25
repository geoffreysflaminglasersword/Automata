<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import flatpickr from "flatpickr";
  import scrollPlugin from "./FPScroller";
  import { getContext, Keys, SuggestionCtx, Register } from "./common";

  type Options = flatpickr.Options.Options;
  type Instantce = flatpickr.Instance;

  let { app, plugin, scope, editor } = getContext<SuggestionCtx>(Keys.suggestion);

  export let months = 3;

  let instance: Instantce;
  export let container: HTMLElement;
  $: positionElement = container;

  // @ts-ignore:
  $: options = {
    // clickOpens: false,
    position: "above center",
    positionElement: positionElement,
    mode: "multiple",
    showMonths: months,
    defaultDate: ["2016-10-20", "2016-11-04"],
    onChange(selectedDates: any, dateStr: string) {
      console.log("flatpickr hook", selectedDates, dateStr);
    },
    plugins: [scrollPlugin()],
  } as Options;

  let unregister: () => void;

  let timer: NodeJS.Timeout;
  onMount(() => {
    instance = flatpickr(container, options /* Object.assign(options, { wrap: true }) */);
    unregister = Register(undefined, undefined, plugin, [
      [
        "cursorActivity",
        (() => {
          instance._positionCalendar(positionElement);
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            if (instance) instance.open();
          }, 800);
          if (instance.isOpen) instance.close();
        }).bind(instance),
      ],
    ]);
  });
  onDestroy(() => {
    instance.destroy();
    instance = null;
    unregister();
  });
</script>

<!-- 
// disable: [
  //   "2025-01-30",
  //   "2025-02-21",
  //   "2025-03-08",
  //   new Date(2025, 4, 9),
  //   {
  //     from: "2025-04-01",
  //     to: "2025-05-01",
  //   },
  //   {
  //     from: "2025-09-01",
  //     to: "2025-12-01",
  //   },
  //   function (date: any) {
  //     // return true to disable
  //     return date.getDay() === 0 || date.getDay() === 6;
  //   },
  // ],
  // enableTime: true,
  // weekNumbers: true,
  //   getWeek: function(dateObj) {
  //     // ...
  // },
  // enable: ["2025-03-30", "2025-05-21", "2025-06-08", new Date(2025, 8, 9) ]  
-->
