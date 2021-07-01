<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import flatpickr from "flatpickr";
  import scrollPlugin from "./FPScroller";
  import { createEventDispatcher } from "svelte";

  import { Register, settings, Options, Instantce, Global } from "common";

  export let selectedDates: Date[] = [],
    container: HTMLElement;
  $: positionElement = container;

  const dispatch = createEventDispatcher();

  let timer: NodeJS.Timeout;
  let instance: Instantce;

  function open() {
    if (instance) instance.destroy();
    instance = null;

    dispatch("preview", {
      update: (opt: Options) => {
        instance = flatpickr(container, Object.assign(options, opt));
        // the position element that follows the cursor aparantly takes time to update
        setTimeout(instance._positionCalendar, 10, positionElement);
        instance.open();
      },
    });
  }

  let unregister: () => void;

  onDestroy(() => {
    unregister();
    if (instance) instance.destroy();
    instance = null;
  });

  onMount(() => {
    unregister = Register(undefined, undefined, Global.plugin, [
      [
        "cursorActivity",
        (() => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(open, $settings.calendarPreviewPopupDelay);
          if (instance?.isOpen) instance.close();
        }).bind(instance),
      ],
    ]);
  });

  // @ts-ignore:
  const options = {
    position: "above center",
    positionElement: positionElement,
    mode: "multiple",
    showMonths: 1,
    plugins: [scrollPlugin()],
    onChange: ((selected: any) => {
      selectedDates = selected;
    }).bind(selectedDates),
  } as Options;
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
