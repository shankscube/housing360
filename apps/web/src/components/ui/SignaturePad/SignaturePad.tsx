import { useEffect, useRef } from 'react';
import { Button } from '../Button';

export interface SignaturePadProps {
  /** The current signature as a PNG data URL, or `null` if unsigned. */
  value: string | null;
  onChange: (value: string) => void;
  onClear: () => void;
  label?: string;
}

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 140;

/**
 * A dependency-free canvas signature pad — pointer events drawn to a
 * `<canvas>`, exported as a PNG data URL on pointer-up. Used twice per ROI
 * form (client signature, staff signature) — see `case-workspace`'s
 * design.md Decision 11. Kept at a modest fixed resolution so the resulting
 * data URL stays comfortably under the `LongText` column it's stored in.
 */
export function SignaturePad({ value, onChange, onClear, label }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || value) {
      return;
    }
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, [value]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    isDrawingRef.current = true;
    lastPointRef.current = getPoint(event);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;

    const point = getPoint(event);
    ctx.strokeStyle = '#1A1D29';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function handlePointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClear();
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? <span className="text-sm font-semibold text-ink">{label}</span> : null}
      <div className="rounded-md border border-borderStrong bg-surface">
        {value ? (
          <img
            src={value}
            alt={label ? `${label} signature` : 'Signature'}
            className="h-signaturePad w-full object-contain"
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="h-signaturePad w-full touch-none"
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-textMuted">{value ? 'Signed' : 'Draw your signature above'}</span>
        <Button type="button" variant="tertiary" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
