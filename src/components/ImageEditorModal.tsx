'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (isOpen && mounted) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      initCanvas();
      setMode('blur');
      setAspectRatio('3:4');
      setBlurIntensity('weak');
    }
  }, [isOpen, mounted, initCanvas]);

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        minHeight: '100vh',
        zIndex: 999999,
        background: 'rgba(6, 8, 14, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '24px 12px 80px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(18, 20, 29, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 67, 112, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header (Sticky top) */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(18, 20, 29, 0.98)',
            backdropFilter: 'blur(10px)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16.5px', fontWeight: 800, color: '#fff' }}>
                ✂️ 사진 편집기
              </span>
              {totalCount > 1 && (
                <span
                  style={{
                    background: 'rgba(255, 67, 112, 0.2)',
                    color: '#ff85a1',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {currentIndex} / {totalCount}
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.6)' }}>
              비율을 맞추고 얼굴을 자연스럽게 모자이크(블러) 처리하세요
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Center Body: Mandatory Alert + Toolbar + Canvas Area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 🚨 Mandatory Mosaic Warning Alert Banner */}
          <div
            style={{
              margin: '12px 14px 4px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.32) 100%)',
              border: '1.5px solid #ef4444',
              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '18px',
                background: 'rgba(239, 68, 68, 0.3)',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              🚨
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '10.5px',
                    fontWeight: 900,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                  }}
                >
                  필수 안내
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#fef2f2' }}>
                  얼굴/이목구비 모자이크(블러)는 필수입니다!
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#fca5a5', lineHeight: 1.45 }}>
                Orbit은 개인정보 및 프라이버시 보호를 위해 <b>얼굴 부위 모자이크 처리를 필수</b>로 운영하고 있습니다.
                아래 <b>'🌫️ 얼굴/배경 블러'</b> 탭에서 사진 속 얼굴을 문질러 가려주세요.
              </p>
            </div>
          </div>

          {/* Toolbar Switcher */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            {/* Main Mode Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setMode('blur')}
                style={{
                  flex: 1.2,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: mode === 'blur' ? '1.5px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.4)',
                  background: mode === 'blur'
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.45) 100%)'
                    : 'rgba(239, 68, 68, 0.08)',
                  color: mode === 'blur' ? '#fff' : '#fca5a5',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: mode === 'blur' ? '0 0 16px rgba(239, 68, 68, 0.4)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                🌫️ 얼굴/배경 블러{' '}
                <span
                  style={{
                    fontSize: '10px',
                    background: '#ef4444',
                    color: '#fff',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: 900,
                  }}
                >
                  필수 🚨
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('crop')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: mode === 'crop' ? '1.5px solid #ff4370' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: mode === 'crop' ? 'rgba(255, 67, 112, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: mode === 'crop' ? '#ff85a1' : 'rgba(255, 255, 255, 0.75)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                ✂️ 비율 자르기
              </button>
            </div>

          {/* Sub-tools for Crop Mode */}
          {mode === 'crop' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginRight: '4px' }}>
                비율 선택:
              </span>
              <button
                type="button"
                onClick={() => applyAspectRatio('3:4')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: aspectRatio === '3:4' ? '1px solid #ff85a1' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: aspectRatio === '3:4' ? 'rgba(255, 67, 112, 0.25)' : 'transparent',
                  color: aspectRatio === '3:4' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                3:4 (카드 추천 ⭐)
              </button>
              <button
                type="button"
                onClick={() => applyAspectRatio('1:1')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: aspectRatio === '1:1' ? '1px solid #ff85a1' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: aspectRatio === '1:1' ? 'rgba(255, 67, 112, 0.25)' : 'transparent',
                  color: aspectRatio === '1:1' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                1:1 (정사각형)
              </button>
              <button
                type="button"
                onClick={() => applyAspectRatio('full')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: aspectRatio === 'full' ? '1px solid #ff85a1' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: aspectRatio === 'full' ? 'rgba(255, 67, 112, 0.25)' : 'transparent',
                  color: aspectRatio === 'full' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                원본 전체
              </button>
              <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: 'auto' }}>
                💡 네모 박스를 드래그하여 위치 이동
              </span>
            </div>
          )}

          {/* Sub-tools for Blur Mode */}
          {mode === 'blur' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Blur Intensity Selector (Weak vs Strong as in User Assets) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
                  블러 강도:
                </span>
                <button
                  type="button"
                  onClick={() => setBlurIntensity('weak')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: blurIntensity === 'weak' ? '1.5px solid #ff85a1' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: blurIntensity === 'weak' ? 'rgba(255, 67, 112, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: blurIntensity === 'weak' ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  🫧 약한 블러 (이목구비 잘 보임)
                </button>
                <button
                  type="button"
                  onClick={() => setBlurIntensity('strong')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: blurIntensity === 'strong' ? '1.5px solid #ff85a1' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: blurIntensity === 'strong' ? 'rgba(255, 67, 112, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: blurIntensity === 'strong' ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  🌫️ 강한 블러 (기존 약한 블러 수준)
                </button>
              </div>

              {/* Brush Size & Undo Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>브러시 크기:</span>
                {(['small', 'medium', 'large'] as BrushSize[]).map((size) => {
                  const label = size === 'small' ? '소' : size === 'medium' ? '중' : '대';
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBrushSize(size)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: brushSize === size ? '1px solid #ff85a1' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: brushSize === size ? 'rgba(255, 67, 112, 0.25)' : 'transparent',
                        color: brushSize === size ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: canUndo ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      color: canUndo ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: canUndo ? 'pointer' : 'not-allowed',
                    }}
                  >
                    ↩️ 되돌리기
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBlur}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🔄 초기화
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div
          ref={containerRef}
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 14px',
            background: 'radial-gradient(circle at center, rgba(30, 34, 48, 0.8) 0%, rgba(10, 12, 18, 0.95) 100%)',
            overflow: 'hidden',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {/* Guide hint above canvas in blur mode */}
          {mode === 'blur' && (
            <div
              style={{
                fontSize: '11.5px',
                color: '#fca5a5',
                marginBottom: '8px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(239, 68, 68, 0.16)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '4px 10px',
                borderRadius: '8px',
                flexShrink: 0,
              }}
            >
              <span>👆</span> 얼굴/이목구비 부위를 마우스나 손가락으로 쓱 문질러 가려주세요
            </div>
          )}

          <div
            style={{
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: mode === 'blur' ? 'crosshair' : 'default',
              display: 'inline-block',
              lineHeight: 0,
              width: '100%',
              maxWidth: '480px',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={(e) => {
              if ('buttons' in e && e.buttons === 0) {
                dragActionRef.current = null;
              }
            }}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
              }}
            />

            {/* Crop Overlay (Only visible in Crop Mode) */}
            {mode === 'crop' && canvasRef.current && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                }}
              >
                {(() => {
                  const cw = canvasRef.current.width || 1;
                  const ch = canvasRef.current.height || 1;
                  const pX = (cropRect.x / cw) * 100;
                  const pY = (cropRect.y / ch) * 100;
                  const pW = (cropRect.width / cw) * 100;
                  const pH = (cropRect.height / ch) * 100;

                  return (
                    <>
                      {/* Darkened mask outside crop box */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: `${pY}%`,
                          background: 'rgba(0, 0, 0, 0.55)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: `${pY + pH}%`,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.55)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: `${pY}%`,
                          left: 0,
                          width: `${pX}%`,
                          height: `${pH}%`,
                          background: 'rgba(0, 0, 0, 0.55)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: `${pY}%`,
                          left: `${pX + pW}%`,
                          right: 0,
                          height: `${pH}%`,
                          background: 'rgba(0, 0, 0, 0.55)',
                        }}
                      />

                      {/* The Crop Box Frame */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${pX}%`,
                          top: `${pY}%`,
                          width: `${pW}%`,
                          height: `${pH}%`,
                          border: '2px solid #ff4370',
                          boxShadow: '0 0 12px rgba(255, 67, 112, 0.5)',
                          pointerEvents: 'auto',
                          cursor: 'move',
                        }}
                      >
                        {/* Rule of thirds grid lines */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '33.3%',
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            background: 'rgba(255, 255, 255, 0.25)',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: '66.6%',
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            background: 'rgba(255, 255, 255, 0.25)',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '33.3%',
                            left: 0,
                            right: 0,
                            height: '1px',
                            background: 'rgba(255, 255, 255, 0.25)',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '66.6%',
                            left: 0,
                            right: 0,
                            height: '1px',
                            background: 'rgba(255, 255, 255, 0.25)',
                          }}
                        />

                        {/* Corner Handles */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            left: '-6px',
                            width: '14px',
                            height: '14px',
                            background: '#fff',
                            border: '2px solid #ff4370',
                            borderRadius: '3px',
                            cursor: 'nwse-resize',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '14px',
                            height: '14px',
                            background: '#fff',
                            border: '2px solid #ff4370',
                            borderRadius: '3px',
                            cursor: 'nesw-resize',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-6px',
                            left: '-6px',
                            width: '14px',
                            height: '14px',
                            background: '#fff',
                            border: '2px solid #ff4370',
                            borderRadius: '3px',
                            cursor: 'nesw-resize',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-6px',
                            right: '-6px',
                            width: '14px',
                            height: '14px',
                            background: '#fff',
                            border: '2px solid #ff4370',
                            borderRadius: '3px',
                            cursor: 'nwse-resize',
                          }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions (Sticky Bottom) */}
      <div
        style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'rgba(15, 17, 24, 0.98)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          bottom: 0,
          zIndex: 30,
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
        }}
      >
        <button
          type="button"
          onClick={handleSkipClick}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          title="얼굴이 없는 풍경/사물 사진인 경우에만 사용"
        >
          원본 등록 (풍경/사물만)
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleDone}
            disabled={isProcessing}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff4370 0%, #ff6b8b 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(255, 67, 112, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isProcessing ? '처리 중...' : '✅ 편집 완료 및 등록'}
          </button>
        </div>
      </div>
    </div>
  </div>
  );

  return createPortal(modalContent, document.body);
}
