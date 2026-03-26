import { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
}

/**
 * Lightweight QR code renderer using Canvas.
 * Generates a simple QR-like pattern from the booking data.
 * For production, swap with a real QR library.
 */
export function QRCode({ value, size = 160 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const modules = 21;
    const cellSize = size / modules;
    canvas.width = size;
    canvas.height = size;

    // Simple hash-based pattern (deterministic from value)
    const hash = (str: string, seed: number) => {
      let h = seed;
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
      }
      return h;
    };

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";

    // Draw finder patterns (corners)
    const drawFinder = (x: number, y: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (isOuter || isInner) {
            ctx.fillRect((x + c) * cellSize, (y + r) * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(modules - 7, 0);
    drawFinder(0, modules - 7);

    // Fill data area with deterministic pattern
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // Skip finder pattern areas
        if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) continue;
        const h = hash(value, r * modules + c);
        if (h % 3 !== 0) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-md border border-border"
      aria-label={`QR code for booking ${value}`}
    />
  );
}
