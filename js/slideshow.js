(function (global) {
  function createSlideshow(target, options) {
    const img = target;
    const state = {
      index: 0,
      timer: null,
      urls: Array.isArray(options.urls) ? options.urls.slice() : [],
      intervalMs: Math.max(3000, Number(options.intervalMs) || 12000),
      onChange: typeof options.onChange === 'function' ? options.onChange : () => {}
    };

    function setImage(index, animate = true) {
      if (!img) return;
      if (!state.urls.length) {
        img.removeAttribute('src');
        state.onChange('', 0, 0);
        return;
      }
      const nextIndex = ((index % state.urls.length) + state.urls.length) % state.urls.length;
      const nextSrc = state.urls[nextIndex];
      if (animate) img.classList.add('is-fading');
      window.setTimeout(() => {
        img.src = nextSrc;
        img.onload = () => img.classList.remove('is-fading');
        if (img.complete) img.classList.remove('is-fading');
        state.index = nextIndex;
        state.onChange(nextSrc, nextIndex + 1, state.urls.length);
      }, animate ? 240 : 0);
    }

    function next() {
      setImage(state.index + 1, true);
    }

    function start() {
      stop();
      if (!state.urls.length) return;
      setImage(state.index, false);
      if (state.urls.length > 1) {
        state.timer = window.setInterval(next, state.intervalMs);
      }
    }

    function stop() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function update(urls, intervalMs) {
      state.urls = Array.isArray(urls) ? urls.slice() : [];
      state.intervalMs = Math.max(3000, Number(intervalMs) || state.intervalMs);
      state.index = 0;
      start();
    }

    return { start, stop, next, update, state };
  }

  global.CadreSlideshow = { createSlideshow };
})(window);
