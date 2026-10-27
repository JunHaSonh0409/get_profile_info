'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './ui';

export interface ImageEditorModalProps {
  isOpen: boolean;
  imageSrc: string;
  currentIndex?: number;
  totalCount?: number;
  onCancel: () => void;
  onComplete: (editedDataUrl: string) => void;
  onSkipEdit: (originalDataUrl: string) => void;
}

type EditorMode = 'crop' | 'blur';
type AspectRatio = '3:4' | '1:1' | 'free' | 'full';
type BlurIntensity = 'weak' | 'strong';
type BrushSize = 'small' | 'medium' | 'large';

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageEditorModal({
  isOpen,
  imageSrc,
  currentIndex = 1,
  totalCount = 1,
  onCancel,
  onComplete,
  onSkipEdit,
}: ImageEditorModalProps) {
  // Mounted once per image (the caller keys it), so initial state doubles as the reset.
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState<EditorMode>('blur');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [blurIntensity, setBlurIntensity] = useState<BlurIntensity>('weak');
  const [brushSize, setBrushSize] = useState<BrushSize>('medium');
  const [canUndo, setCanUndo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pre-rendered blurred canvases for silky smooth 60fps feathered blur
  const weakBlurCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strongBlurCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Crop box state (in canvas display coordinates)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });

  // Drag interaction state
  const dragActionRef = useRef<
    | { type: 'move'; startX: number; startY: number; initialRect: CropRect }
    | { type: 'resize'; handle: string; startX: number; startY: number; initialRect: CropRect }
    | { type: 'blur' }
    | null
  >(null);

  // Undo history for blur strokes
  const historyRef = useRef<ImageData[]>([]);

  // Adjust crop rect based on selected aspect ratio (at full image resolution)
  const applyAspectRatio = useCallback((ratio: AspectRatio, cWidth?: number, cHeight?: number) => {
    const canvas = canvasRef.current;
    const w = cWidth || (canvas ? canvas.width : 1200);
    const h = cHeight || (canvas ? canvas.height : 1600);

    setAspectRatio(ratio);

    if (ratio === 'full') {
      setCropRect({ x: 0, y: 0, width: w, height: h });
      return;
    }

    let targetW = w;
    let targetH = h;

    if (ratio === '3:4') {
      const targetRatio = 3 / 4;
      if (targetW / targetH > targetRatio) {
        targetW = targetH * targetRatio;
      } else {
        targetH = targetW / targetRatio;
      }
    } else if (ratio === '1:1') {
      const size = Math.min(targetW, targetH);
      targetW = size;
      targetH = size;
    }

    setCropRect({
      x: Math.round((w - targetW) / 2),
      y: Math.round((h - targetH) / 2),
      width: Math.round(targetW),
      height: Math.round(targetH),
    });
  }, []);

  // Initialize canvas with full original image resolution
  const initCanvas = useCallback(() => {
    if (!imageSrc) return;

    const img = new Image();
    // Do not set crossOrigin on data: or blob: URLs (causes silent loading failures in Chromium/Safari)
    if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const setupWithImage = (loadedImg: HTMLImageElement) => {
      const setup = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          // Wait for DOM portal attachment if not ready yet
          requestAnimationFrame(setup);
          return;
        }

        // Keep full original dimensions (cap at 2560px for mobile canvas memory safety)
        const origW = loadedImg.naturalWidth || loadedImg.width;
        const origH = loadedImg.naturalHeight || loadedImg.height;

        const MAX_CANVAS_DIM = 2560;
        let targetW = origW;
        let targetH = origH;
        if (targetW > MAX_CANVAS_DIM || targetH > MAX_CANVAS_DIM) {
          if (targetW >= targetH) {
            targetH = Math.round((targetH * MAX_CANVAS_DIM) / targetW);
            targetW = MAX_CANVAS_DIM;
          } else {
            targetW = Math.round((targetW * MAX_CANVAS_DIM) / targetH);
            targetH = MAX_CANVAS_DIM;
          }
        }

        canvas.width = targetW;
        canvas.height = targetH;
        setCanvasSize({ width: targetW, height: targetH });

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(loadedImg, 0, 0, targetW, targetH);
          // Save initial state for undo
          historyRef.current = [ctx.getImageData(0, 0, targetW, targetH)];
          setCanUndo(false);
        }

        // Scale blur radius proportionally with resolution
        const blurScale = Math.max(1, targetW / 400);
        const weakBlurPx = (2.2 * blurScale).toFixed(1);
        const strongBlurPx = (8.0 * blurScale).toFixed(1);

        // 1. Generate Weak Blur layer
        const weakCanvas = document.createElement('canvas');
        weakCanvas.width = targetW;
        weakCanvas.height = targetH;
        const wCtx = weakCanvas.getContext('2d');
        if (wCtx) {
          wCtx.filter = `blur(${weakBlurPx}px)`;
          wCtx.drawImage(loadedImg, 0, 0, targetW, targetH);
        }
        weakBlurCanvasRef.current = weakCanvas;

        // 2. Generate Strong Blur layer
        const strongCanvas = document.createElement('canvas');
        strongCanvas.width = targetW;
        strongCanvas.height = targetH;
        const sCtx = strongCanvas.getContext('2d');
        if (sCtx) {
          sCtx.filter = `blur(${strongBlurPx}px)`;
          sCtx.drawImage(loadedImg, 0, 0, targetW, targetH);
        }
        strongBlurCanvasRef.current = strongCanvas;

        // Initialize default 3:4 crop rect with full resolution coordinates
        applyAspectRatio('3:4', targetW, targetH);
      };

      setup();
    };

    img.onload = () => setupWithImage(img);
    img.onerror = (e) => {
      console.warn('Failed to load image, attempting fallback without crossOrigin:', e);
      if (img.crossOrigin) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => setupWithImage(fallbackImg);
        fallbackImg.src = imageSrc;
      }
    };
    img.src = imageSrc;
  }, [imageSrc, applyAspectRatio]);

  useEffect(() => {
    if (isOpen) initCanvas();
  }, [isOpen, initCanvas]);

  // Global drag release listener to ensure dragging stops even when mouseup occurs outside canvas
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalRelease = () => {
      dragActionRef.current = null;
    };

    const handleGlobalMove = (e: MouseEvent | PointerEvent) => {
      // If pointer is moving anywhere on the screen without mouse button pressed, cancel drag
      if ('buttons' in e && e.buttons === 0 && dragActionRef.current) {
        dragActionRef.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('pointermove', handleGlobalMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('pointermove', handleGlobalMove);
    };
  }, [isOpen]);

  // Smooth Feathered Blur Brush Applicator (scaled to canvas resolution)
  const applyBlurAt = (cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceCanvas =
      blurIntensity === 'weak' ? weakBlurCanvasRef.current : strongBlurCanvasRef.current;
    if (!sourceCanvas) return;

    const radiusMap: Record<BrushSize, number> = {
      small: 22,
      medium: 42,
      large: 70,
    };
    const rect = canvas.getBoundingClientRect();
    const resolutionScale = rect.width > 0 ? canvas.width / rect.width : 1;
    const radius = Math.round(radiusMap[brushSize] * resolutionScale);
    const diameter = radius * 2;

    // Offscreen stamp for feathered radial falloff
    const stamp = document.createElement('canvas');
    stamp.width = diameter;
    stamp.height = diameter;
    const sCtx = stamp.getContext('2d');
    if (!sCtx) return;

    // Radial gradient for natural smooth edges (no hard borders)
    const grad = sCtx.createRadialGradient(radius, radius, radius * 0.35, radius, radius, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    sCtx.fillStyle = grad;
    sCtx.beginPath();
    sCtx.arc(radius, radius, radius, 0, Math.PI * 2);
    sCtx.fill();

    // Composite the blurred image into the feathered circle
    sCtx.globalCompositeOperation = 'source-in';
    sCtx.drawImage(
      sourceCanvas,
      cx - radius,
      cy - radius,
      diameter,
      diameter,
      0,
      0,
      diameter,
      diameter
    );

    // Paint onto main canvas
    ctx.drawImage(stamp, cx - radius, cy - radius);
  };

  // Save current canvas state to history for undo
  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 15) {
      historyRef.current.shift();
    }
    setCanUndo(historyRef.current.length > 1);
  };

  // Undo last blur action
  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop(); // Remove current state
    const prevState = historyRef.current[historyRef.current.length - 1];
    const canvas = canvasRef.current;
    if (canvas && prevState) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(prevState, 0, 0);
      }
    }
    setCanUndo(historyRef.current.length > 1);
  };

  // Reset blur back to original
  const handleResetBlur = () => {
    if (historyRef.current.length === 0) return;
    const originalState = historyRef.current[0];
    const canvas = canvasRef.current;
    if (canvas && originalState) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(originalState, 0, 0);
        historyRef.current = [originalState];
        setCanUndo(false);
      }
    }
  };

  // Coordinate helper
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Pointer Down handler
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Ignore non-primary mouse clicks (right click, middle click)
    if ('button' in e && e.button !== 0) return;

    const { x, y } = getCanvasCoords(e);

    if (mode === 'blur') {
      saveHistory();
      dragActionRef.current = { type: 'blur' };
      applyBlurAt(x, y);
      return;
    }

    // In Crop Mode: check handles or crop box
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const resolutionScale = rect.width > 0 ? canvas.width / rect.width : 1;
    const handleHitRadius = 32 * resolutionScale;
    const { x: rx, y: ry, width: rw, height: rh } = cropRect;

    // Corner handle detection
    const handles = [
      { name: 'tl', hx: rx, hy: ry },
      { name: 'tr', hx: rx + rw, hy: ry },
      { name: 'br', hx: rx + rw, hy: ry + rh },
      { name: 'bl', hx: rx, hy: ry + rh },
    ];

    for (const h of handles) {
      if (Math.hypot(x - h.hx, y - h.hy) <= handleHitRadius) {
        dragActionRef.current = {
          type: 'resize',
          handle: h.name,
          startX: x,
          startY: y,
          initialRect: { ...cropRect },
        };
        return;
      }
    }

    // Check inside crop box for moving
    if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
      dragActionRef.current = {
        type: 'move',
        startX: x,
        startY: y,
        initialRect: { ...cropRect },
      };
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragActionRef.current) return;

    // If mouse button is not currently pressed down, cancel drag immediately
    if ('buttons' in e && e.buttons === 0) {
      dragActionRef.current = null;
      return;
    }

    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragActionRef.current.type === 'blur') {
      applyBlurAt(x, y);
      return;
    }

    const { startX, startY, initialRect } = dragActionRef.current;
    const dx = x - startX;
    const dy = y - startY;

    if (dragActionRef.current.type === 'move') {
      const newX = Math.max(0, Math.min(canvas.width - initialRect.width, initialRect.x + dx));
      const newY = Math.max(0, Math.min(canvas.height - initialRect.height, initialRect.y + dy));
      setCropRect((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
    } else if (dragActionRef.current.type === 'resize') {
      const rect = canvas.getBoundingClientRect();
      const resolutionScale = rect.width > 0 ? canvas.width / rect.width : 1;
      const minSize = Math.max(50, 40 * resolutionScale);
      const handle = dragActionRef.current.handle;
      let newX = initialRect.x;
      let newY = initialRect.y;
      let newW = initialRect.width;
      let newH = initialRect.height;

      if (handle === 'br') {
        newW = Math.max(minSize, initialRect.width + dx);
        if (aspectRatio === '3:4') newH = (newW * 4) / 3;
        else if (aspectRatio === '1:1') newH = newW;
        else newH = Math.max(minSize, initialRect.height + dy);
      } else if (handle === 'tr') {
        newW = Math.max(minSize, initialRect.width + dx);
        if (aspectRatio === '3:4') newH = (newW * 4) / 3;
        else if (aspectRatio === '1:1') newH = newW;
        else newH = Math.max(minSize, initialRect.height - dy);
        newY = initialRect.y + initialRect.height - newH;
      } else if (handle === 'bl') {
        newW = Math.max(minSize, initialRect.width - dx);
        newX = initialRect.x + initialRect.width - newW;
        if (aspectRatio === '3:4') newH = (newW * 4) / 3;
        else if (aspectRatio === '1:1') newH = newW;
        else newH = Math.max(minSize, initialRect.height + dy);
      } else if (handle === 'tl') {
        newW = Math.max(minSize, initialRect.width - dx);
        newX = initialRect.x + initialRect.width - newW;
        if (aspectRatio === '3:4') newH = (newW * 4) / 3;
        else if (aspectRatio === '1:1') newH = newW;
        else newH = Math.max(minSize, initialRect.height - dy);
        newY = initialRect.y + initialRect.height - newH;
      }

      // Constrain within canvas bounds
      if (newX < 0) {
        newW += newX;
        newX = 0;
      }
      if (newY < 0) {
        newH += newY;
        newY = 0;
      }
      if (newX + newW > canvas.width) newW = canvas.width - newX;
      if (newY + newH > canvas.height) newH = canvas.height - newY;

      setCropRect({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    }
  };

  // Pointer Up handler
  const handlePointerUp = () => {
    dragActionRef.current = null;
  };

  // Skip edit with mandatory blur check/confirmation
  const handleSkipClick = () => {
    const proceed = window.confirm(
      '⚠️ [필수 안내]\n프로필 사진은 얼굴 모자이크(블러) 처리가 필수 사항입니다.\n\n얼굴이 노출되지 않는 풍경/사물 사진인 경우에만 원본으로 등록해주세요.\n\n모자이크 없이 원본으로 등록하시겠습니까?'
    );
    if (proceed) {
      onSkipEdit(imageSrc);
    }
  };

  // Complete edit and export high-efficiency WebP (30~50KB)
  const handleDone = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if blur was applied
    if (historyRef.current.length <= 1) {
      const proceed = window.confirm(
        '🚨 [필수 안내]\n얼굴 부위 모자이크(블러) 처리가 확인되지 않았습니다.\n\nOrbit은 프라이버시 보호를 위해 얼굴 모자이크(블러) 처리가 필수입니다.\n\n얼굴이 없는 풍경/사물 사진이어서 모자이크 없이 그대로 등록하시겠습니까?'
      );
      if (!proceed) {
        setMode('blur');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Create output canvas for cropped region at FULL original resolution
      const outCanvas = document.createElement('canvas');
      const cropW = Math.max(10, Math.round(cropRect.width));
      const cropH = Math.max(10, Math.round(cropRect.height));

      outCanvas.width = cropW;
      outCanvas.height = cropH;

      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) throw new Error('출력 캔버스 생성 실패');

      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = 'high';

      // Draw cropped area from source canvas
      outCtx.drawImage(
        canvas,
        Math.round(cropRect.x),
        Math.round(cropRect.y),
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
      );

      // Export as high quality WebP / JPEG (0.90) maintaining crisp original resolution
      let exportedUrl = '';
      try {
        exportedUrl = outCanvas.toDataURL('image/webp', 0.90);
        if (!exportedUrl || !exportedUrl.startsWith('data:image/webp')) {
          exportedUrl = outCanvas.toDataURL('image/jpeg', 0.90);
        }
      } catch {
        exportedUrl = outCanvas.toDataURL('image/jpeg', 0.90);
      }

      onComplete(exportedUrl);
    } catch (err) {
      console.error('Export error:', err);
      onComplete(imageSrc); // Fallback
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const { width: cw, height: ch } = canvasSize;
  const pct = (v: number, total: number) => `${(v / (total || 1)) * 100}%`;
  const crop = cw
    ? {
        left: pct(cropRect.x, cw),
        top: pct(cropRect.y, ch),
        width: pct(cropRect.width, cw),
        height: pct(cropRect.height, ch),
        right: pct(cw - cropRect.x - cropRect.width, cw),
        bottom: pct(ch - cropRect.y - cropRect.height, ch),
      }
    : null;

  const modalContent = (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="photo-editor-title">
        <div className="modal__head">
          <div>
            <h2 id="photo-editor-title" className="title">
              사진 편집 {totalCount > 1 && <span className="muted small">{currentIndex} / {totalCount}</span>}
            </h2>
            <p className="hint">얼굴을 문질러 가린 뒤, 비율을 맞춰 등록하세요.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="편집 취소">
            <Icon name="close" />
          </button>
        </div>

        <div className="modal__body">
          <p className="notice notice--error">
            Orbit은 사생활 보호를 위해 <strong>얼굴 가림이 필수</strong>예요. 얼굴 가리기 탭에서 얼굴 부위를 문질러주세요.
          </p>

          <div className="seg" role="tablist" aria-label="편집 도구">
            <button type="button" role="tab" aria-selected={mode === 'blur'} onClick={() => setMode('blur')}>
              얼굴 가리기
            </button>
            <button type="button" role="tab" aria-selected={mode === 'crop'} onClick={() => setMode('crop')}>
              비율 자르기
            </button>
          </div>

          {mode === 'blur' ? (
            <div className="stack">
              <div className="row row--wrap">
                <span className="small muted">강도</span>
                <button type="button" className="chip" aria-pressed={blurIntensity === 'weak'} onClick={() => setBlurIntensity('weak')}>
                  약하게
                </button>
                <button type="button" className="chip" aria-pressed={blurIntensity === 'strong'} onClick={() => setBlurIntensity('strong')}>
                  강하게
                </button>
              </div>
              <div className="row row--wrap">
                <span className="small muted">브러시</span>
                {(['small', 'medium', 'large'] as BrushSize[]).map((size) => (
                  <button key={size} type="button" className="chip" aria-pressed={brushSize === size} onClick={() => setBrushSize(size)}>
                    {size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto' }} className="row">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={handleUndo} disabled={!canUndo}>
                    <Icon name="undo" /> 되돌리기
                  </button>
                  <button type="button" className="btn btn--quiet btn--sm" onClick={handleResetBlur} disabled={!canUndo}>
                    처음으로
                  </button>
                </span>
              </div>
            </div>
          ) : (
            <div className="row row--wrap">
              <span className="small muted">비율</span>
              {([
                ['3:4', '3:4 카드'],
                ['1:1', '1:1'],
                ['full', '원본'],
              ] as [AspectRatio, string][]).map(([ratio, label]) => (
                <button key={ratio} type="button" className="chip" aria-pressed={aspectRatio === ratio} onClick={() => applyAspectRatio(ratio)}>
                  {label}
                </button>
              ))}
              <span className="hint" style={{ marginLeft: 'auto' }}>상자를 끌어 위치를 옮기세요</span>
            </div>
          )}

          <div className="center" ref={containerRef}>
            <div
              className="editor-canvas"
              style={{ cursor: mode === 'blur' ? 'crosshair' : 'move' }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={(e) => {
                if (e.buttons === 0) dragActionRef.current = null;
              }}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              <canvas ref={canvasRef} />
              {mode === 'crop' && crop && (
                <>
                  <div className="crop-shade" style={{ left: 0, top: 0, right: 0, height: crop.top }} />
                  <div className="crop-shade" style={{ left: 0, bottom: 0, right: 0, height: crop.bottom }} />
                  <div className="crop-shade" style={{ left: 0, top: crop.top, bottom: crop.bottom, width: crop.left }} />
                  <div className="crop-shade" style={{ right: 0, top: crop.top, bottom: crop.bottom, width: crop.right }} />
                  <div className="crop-box" style={{ left: crop.left, top: crop.top, width: crop.width, height: crop.height }}>
                    <span className="crop-handle" style={{ left: -10, top: -10 }} />
                    <span className="crop-handle" style={{ right: -10, top: -10 }} />
                    <span className="crop-handle" style={{ right: -10, bottom: -10 }} />
                    <span className="crop-handle" style={{ left: -10, bottom: -10 }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal__foot" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--quiet" onClick={handleSkipClick} title="얼굴이 없는 풍경이나 사물 사진일 때만">
            원본으로 등록
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn btn--primary" onClick={handleDone} disabled={isProcessing}>
            {isProcessing ? '처리하는 중' : '편집 완료'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
