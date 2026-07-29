import { Jimp } from 'jimp';
import path from 'path';

function rgbaToInt(r, g, b, a) {
  return ((r & 0xff) << 24 | (g & 0xff) << 16 | (b & 0xff) << 8 | (a & 0xff)) >>> 0;
}

async function createIcon() {
  const size = 1024;
  const image = new Jimp({ width: size, height: size, color: 0x00000000 });

  // Draw rounded rect background badge
  const radius = 220; // squircle corner radius
  const margin = 32;  // margin inside 1024 box
  const innerSize = size - margin * 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let dx = 0;
      if (x < margin + radius) dx = margin + radius - x;
      else if (x > size - margin - radius) dx = x - (size - margin - radius);

      let dy = 0;
      if (y < margin + radius) dy = margin + radius - y;
      else if (y > size - margin - radius) dy = y - (size - margin - radius);

      const dist = Math.sqrt(dx * dx + dy * dy);

      if (x < margin || x > size - margin || y < margin || y > size - margin) {
        if (dist > radius) {
          continue;
        }
      }

      let alpha = 255;
      if (dist > radius - 2 && dist <= radius) {
        alpha = Math.floor((radius - dist) * 127.5);
      }

      const ratioY = (y - margin) / innerSize;
      const ratioX = (x - margin) / innerSize;
      
      const r = Math.floor(15 + ratioY * (13 - 15) + ratioX * (20 - 15));
      const g = Math.floor(23 + ratioY * (148 - 23) + ratioX * (60 - 23));
      const b = Math.floor(42 + ratioY * (136 - 42) + ratioX * (90 - 42));

      const color = rgbaToInt(r, g, b, alpha);
      image.setPixelColor(color, x, y);
    }
  }

  // Draw oil drop & gauge icon elements in center
  const centerX = size / 2;
  const centerY = size / 2 - 20;

  for (let y = Math.floor(centerY - 280); y <= Math.floor(centerY + 240); y++) {
    for (let x = Math.floor(centerX - 220); x <= Math.floor(centerX + 220); x++) {
      const relX = x - centerX;
      const relY = y - (centerY + 40);

      let inDrop = false;
      if (relY >= 0) {
        if (relX * relX + relY * relY <= 180 * 180) {
          inDrop = true;
        }
      } else {
        const topProgress = (relY + 280) / 280;
        if (topProgress >= 0 && topProgress <= 1) {
          const maxWidthAtY = 180 * Math.sin(topProgress * Math.PI / 2);
          if (Math.abs(relX) <= maxWidthAtY) {
            inDrop = true;
          }
        }
      }

      if (inDrop) {
        const dropRatioY = (y - (centerY - 280)) / 520;
        const dr = Math.floor(251 - dropRatioY * (251 - 217));
        const dg = Math.floor(191 - dropRatioY * (191 - 119));
        const db = Math.floor(36 + dropRatioY * (36 - 6));

        const sheenX = x - (centerX - 50);
        const sheenY = y - (centerY - 40);
        const sheenDist = Math.sqrt(sheenX * sheenX + sheenY * sheenY);
        let finalR = dr, finalG = dg, finalB = db;

        if (sheenDist < 45) {
          const sheenIntensity = (1 - sheenDist / 45) * 0.6;
          finalR = Math.min(255, Math.floor(dr + (255 - dr) * sheenIntensity));
          finalG = Math.min(255, Math.floor(dg + (255 - dg) * sheenIntensity));
          finalB = Math.min(255, Math.floor(db + (255 - db) * sheenIntensity));
        }

        const dropColor = rgbaToInt(finalR, finalG, finalB, 255);
        image.setPixelColor(dropColor, x, y);
      }
    }
  }

  // Draw petroleum tank / volume scale tick marks on the right side of drop
  for (let tick = -3; tick <= 3; tick++) {
    const tickY = Math.floor(centerY + tick * 45);
    const tickWidth = tick === 0 ? 70 : 45;
    const startX = Math.floor(centerX + 180);
    for (let ty = tickY - 4; ty <= tickY + 4; ty++) {
      for (let tx = startX; tx <= startX + tickWidth; tx++) {
        const tickColor = rgbaToInt(241, 245, 249, 230);
        image.setPixelColor(tickColor, tx, ty);
      }
    }
  }

  const outputPath = path.join(process.cwd(), 'app-icon.png');
  await image.write(outputPath);
  console.log('Successfully generated 1024x1024 app-icon.png at', outputPath);
}

createIcon().catch((err) => {
  console.error('Error creating icon:', err);
  process.exit(1);
});
