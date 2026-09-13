// Pure image preparation and line comparison; no Chrome API calls here.
const SnipperImage = (() => {
  function canvasOf(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function sameArea(a, b) {
    const overlapX = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
    const overlapY = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    const minWidth = Math.max(1, Math.min(a.x1 - a.x0, b.x1 - b.x0));
    const minHeight = Math.max(1, Math.min(a.y1 - a.y0, b.y1 - b.y0));
    const maxHeight = Math.max(a.y1 - a.y0, b.y1 - b.y0);
    return overlapX / minWidth > 0.6 && overlapY / minHeight > 0.6 && maxHeight / minHeight < 2.2;
  }

  function makeVariants(source) {
    const width = source.width - 32;
    const height = source.height - 32;
    const pixels = source.getContext("2d").getImageData(16, 16, width, height);
    const gray = canvasOf(source.width, source.height);
    const context = gray.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, gray.width, gray.height);
    const output = context.createImageData(width, height);
    const histogram = new Uint32Array(256);
    for (let i = 0; i < pixels.data.length; i += 4) {
      histogram[Math.round(0.299 * pixels.data[i] + 0.587 * pixels.data[i + 1] + 0.114 * pixels.data[i + 2])]++;
    }
    function percentile(fraction) {
      let total = 0;
      for (let value = 0; value < 256; value++) {
        total += histogram[value];
        if (total >= width * height * fraction) return value;
      }
      return 255;
    }
    const low = percentile(0.02);
    const high = percentile(0.98);
    const invert = percentile(0.5) < 128;
    for (let i = 0; i < pixels.data.length; i += 4) {
      let value = 0.299 * pixels.data[i] + 0.587 * pixels.data[i + 1] + 0.114 * pixels.data[i + 2];
      value = Math.max(0, Math.min(255, (value - low) * 255 / Math.max(1, high - low)));
      if (invert) value = 255 - value;
      output.data[i] = output.data[i + 1] = output.data[i + 2] = value;
      output.data[i + 3] = 255;
    }
    context.putImageData(output, 16, 16);

    const bands = [];
    // Find dominant red, green, or blue lettering separately from its background.
    for (let channel = 0; channel < 3; channel++) {
      const mask = canvasOf(source.width, source.height);
      const mc = mask.getContext("2d");
      mc.fillStyle = "white";
      mc.fillRect(0, 0, mask.width, mask.height);
      const out = mc.createImageData(width, height);
      const rows = new Uint32Array(height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const main = pixels.data[i + channel];
        const other = Math.max(pixels.data[i + (channel + 1) % 3], pixels.data[i + (channel + 2) % 3]);
        const ink = main > 70 && main > other * 1.4;
        if (ink) rows[Math.floor(i / 4 / width)]++;
        out.data[i] = out.data[i + 1] = out.data[i + 2] = ink ? 0 : 255;
        out.data[i + 3] = 255;
      }
      mc.putImageData(out, 16, 16);
      let start = -1;
      let last = -1;
      for (let y = 0; y <= height; y++) {
        if (y < height && rows[y] > Math.max(6, width * 0.015) && rows[y] < width * 0.85) {
          if (start < 0) start = y;
          last = y;
        }
        if (start >= 0 && (y - last > 3 || y === height)) {
          const bandHeight = last - start + 1;
          if (bandHeight >= 16) {
            const crop = canvasOf(mask.width, bandHeight + 20);
            const cc = crop.getContext("2d");
            cc.fillStyle = "white";
            cc.fillRect(0, 0, crop.width, crop.height);
            cc.drawImage(mask, 0, start + 16, mask.width, bandHeight, 0, 10, mask.width, bandHeight);
            bands.push({ canvas: crop, y: start + 6, height: bandHeight });
          }
          start = -1;
        }
      }
    }
    bands.sort((a, b) => b.height - a.height);
    return { gray, bands };
  }
  return { canvasOf, sameArea, makeVariants };
})();
