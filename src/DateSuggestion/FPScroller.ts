import flatpickr from "flatpickr";

type Instance = flatpickr.Instance;
type Plugin = flatpickr.Options.Plugin;

function delta(e: WheelEvent) {
  return Math.max(-1, Math.min(1, -e.deltaY));
}


export default function scrollPlugin(): Plugin {
  return function (fp) {
    const monthScroller = ((e: WheelEvent) => {
      e.preventDefault();
      fp.changeMonth(-delta(e));
    }).bind(fp);
    const yearScroller = ((e: WheelEvent) => {
      e.preventDefault();
      fp.changeYear(fp.currentYear - delta(e));
    }).bind(fp);
    return {
      onReady() {
        fp.innerContainer.addEventListener("wheel", monthScroller);
        // fp.innerContainer
        fp.yearElements.forEach((yearElem) => yearElem.addEventListener("wheel", yearScroller));
        fp.loadedPlugins.push("scroll");
      },
      onDestroy() {
        fp.innerContainer.removeEventListener("wheel", monthScroller);
        fp.yearElements.forEach((yearElem) => yearElem.removeEventListener("wheel", yearScroller));
      },
    };
  };
}

//NOTE:20 might use year scrolling at some point





//TODO: rework positioning logic from flatpickr to auto adjust width and always be centered on cursor (and not wrap)

/*



function createStyleSheet() {
    const style = document.createElement("style");
    document.head.appendChild(style);
    return style.sheet as CSSStyleSheet;
  }


let self:Instance;

function getDocumentStyleSheet() {
    let editableSheet = null;
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i] as CSSStyleSheet;
      try {
        sheet.cssRules;
      } catch (err) {
        continue;
      }
      editableSheet = sheet;
      break;
    }
    return editableSheet != null ? editableSheet : createStyleSheet();
  }

function createEvent(name: string): Event {
    const e = document.createEvent("Event");
    e.initEvent(name, true, true);
    return e;
  }

type HookKey =
  | "onChange"
  | "onClose"
  | "onDayCreate"
  | "onDestroy"
  | "onKeyDown"
  | "onMonthChange"
  | "onOpen"
  | "onParseConfig"
  | "onReady"
  | "onValueUpdate"
  | "onYearChange"
  | "onPreCalendarPosition";

function triggerEvent(event: HookKey, data?: any) {
    // If the instance has been destroyed already, all hooks have been removed
    if (self.config === undefined) return;

    const hooks = self.config[event];

    if (hooks !== undefined && hooks.length > 0) {
      for (let i = 0; hooks[i] && i < hooks.length; i++)
        hooks[i](self.selectedDates, self.input.value, self, data);
    }

    if (event === "onChange") {
      self.input.dispatchEvent(createEvent("change"));

      // many front-end frameworks bind to the input event
      self.input.dispatchEvent(createEvent("input"));
    }
  }


function positionCalendar(customPositionElement?: HTMLElement) :any {
    if (typeof self.config.position === "function") {
      return void self.config.position(self, customPositionElement);
    }
    if (self.calendarContainer === undefined) return;

    triggerEvent("onPreCalendarPosition");
    const positionElement = customPositionElement || self._positionElement;

    const calendarHeight = Array.prototype.reduce.call(
        self.calendarContainer.children,
        ((acc: number, child: HTMLElement) => acc + child.offsetHeight) as any,
        0
      ) as number,
      calendarWidth = self.calendarContainer.offsetWidth,
      configPos = self.config.position.split(" "),
      configPosVertical = configPos[0],
      configPosHorizontal = configPos.length > 1 ? configPos[1] : null,
      inputBounds = positionElement.getBoundingClientRect(),
      distanceFromBottom = window.innerHeight - inputBounds.bottom,
      showOnTop =
        configPosVertical === "above" ||
        (configPosVertical !== "below" &&
          distanceFromBottom < calendarHeight &&
          inputBounds.top > calendarHeight);

    const top =
      window.pageYOffset +
      inputBounds.top +
      (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2);

    toggleClass(self.calendarContainer, "arrowTop", !showOnTop);
    toggleClass(self.calendarContainer, "arrowBottom", showOnTop);

    if (self.config.inline) return;

    let left = window.pageXOffset + inputBounds.left;
    let isCenter = false;
    let isRight = false;

    if (configPosHorizontal === "center") {
      left -= (calendarWidth - inputBounds.width) / 2;
      isCenter = true;
    } else if (configPosHorizontal === "right") {
      left -= calendarWidth - inputBounds.width;
      isRight = true;
    }

    toggleClass(self.calendarContainer, "arrowLeft", !isCenter && !isRight);
    toggleClass(self.calendarContainer, "arrowCenter", isCenter);
    toggleClass(self.calendarContainer, "arrowRight", isRight);

    const right =
      window.document.body.offsetWidth -
      (window.pageXOffset + inputBounds.right);
    const rightMost = left + calendarWidth > window.document.body.offsetWidth;
    const centerMost = right + calendarWidth > window.document.body.offsetWidth;

    toggleClass(self.calendarContainer, "rightMost", rightMost);

    if (self.config.static) return;

    self.calendarContainer.style.top = `${top}px`;

    if (!rightMost) {
      self.calendarContainer.style.left = `${left}px`;
      self.calendarContainer.style.right = "auto";
    } else if (!centerMost) {
      self.calendarContainer.style.left = "auto";
      self.calendarContainer.style.right = `${right}px`;
    } else {
      const doc = getDocumentStyleSheet() as CSSStyleSheet;
      // some testing environments don't have css support
      if (doc === undefined) return;
      const bodyWidth = window.document.body.offsetWidth;
      const centerLeft = Math.max(0, bodyWidth / 2 - calendarWidth / 2);
      const centerBefore = ".flatpickr-calendar.centerMost:before";
      const centerAfter = ".flatpickr-calendar.centerMost:after";
      const centerIndex = doc.cssRules.length;
      const centerStyle = `{left:${inputBounds.left}px;right:auto;}`;
      toggleClass(self.calendarContainer, "rightMost", false);
      toggleClass(self.calendarContainer, "centerMost", true);
      doc.insertRule(
        `${centerBefore},${centerAfter}${centerStyle}`,
        centerIndex
      );
      self.calendarContainer.style.left = `${centerLeft}px`;
      self.calendarContainer.style.right = "auto";
    }
}

export function toggleClass(
    elem: HTMLElement,
    className: string,
    bool: boolean
  ) {
    if (bool === true) return elem.classList.add(className);
    elem.classList.remove(className);
  }

  */