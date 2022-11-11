export function resize(element) {
    const bottomRight = document.createElement("div");
    bottomRight.classList.add("grabber");

    let
        initialRect = null,
        initialPos = null;

    element.appendChild(bottomRight);
    bottomRight.addEventListener("mousedown", onMousedown);

    function onMousedown(event) {
        const rect = element.getBoundingClientRect();
        const parent = element.parentElement.getBoundingClientRect();

        console.log({ rect, parent });

        initialRect = {
            width: rect.width,
            height: rect.height,
            left: rect.left - parent.left,
            right: parent.right - rect.right,
            top: rect.top - parent.top,
            bottom: parent.bottom - rect.bottom,
        };
        initialPos = { x: event.pageX, y: event.pageY };
    }

    function onMouseup() {
        initialRect = null;
        initialPos = null;
    }

    function onMove(event) {
        element.style.width = `${initialRect.width + event.pageX - initialPos.x}px`;
        element.style.height = `${initialRect.height + event.pageY - initialPos.y}px`;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onMouseup);

    return {
        destroy() {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mousemove", onMousedown);
            element.removeChild(bottomRight);
        },
    };
}