
import './draggable.css';

export function setupDraggable(id) {

    const dragItem = document.getElementById(id);

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let originalSelectStart = null;

    let scrollInterval = null;
    let lastMouseX = 0;
    let lastMouseY = 0;

    dragItem.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - dragItem.offsetLeft + window.scrollX;
      offsetY = e.clientY - dragItem.offsetTop + window.scrollY;
      dragItem.style.cursor = "grabbing";

      originalSelectStart = document.onselectstart;
      document.onselectstart = () => false;

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      startAutoScroll();
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        e.preventDefault();
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        updateDragPosition();
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      dragItem.style.cursor = "grab";
      document.onselectstart = originalSelectStart;
      stopAutoScroll();
    });

    function updateDragPosition() {
      const docWidth = document.documentElement.scrollWidth;
      const docHeight = document.documentElement.scrollHeight;
      const elementWidth = dragItem.offsetWidth;
      const elementHeight = dragItem.offsetHeight;

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = lastMouseX + scrollX - offsetX;
      let y = lastMouseY + scrollY - offsetY;

      // Clamp to document bounds
      x = Math.max(0, Math.min(x, docWidth - elementWidth));
      y = Math.max(0, Math.min(y, docHeight - elementHeight));

      // Clamp to viewport (so element stays fully on screen)
      x = Math.max(scrollX, Math.min(x, scrollX + viewportWidth - elementWidth));
      y = Math.max(scrollY, Math.min(y, scrollY + viewportHeight - elementHeight));

      dragItem.style.left = x + "px";
      dragItem.style.top = y + "px";
    }

    function startAutoScroll() {
      stopAutoScroll();

      scrollInterval = setInterval(() => {
        if (!isDragging) return;

        const scrollStep = 20;
        const buffer = 50;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        if (lastMouseY < buffer && window.scrollY > 0) {
          window.scrollBy(0, -scrollStep);
        } else if (lastMouseY > window.innerHeight - buffer && window.scrollY < maxScroll) {
          window.scrollBy(0, scrollStep);
        }

        updateDragPosition(); // keep position in sync
      }, 16);
    }

    function stopAutoScroll() {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }
  }