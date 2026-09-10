/**
 * SignaturePad Component
 * HTML5 Canvas-based signature drawing pad
 */

"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onSignatureChange,
  width = 600,
  height = 150,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Set drawing styles
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Get coordinates from event
  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();

      if ("touches" in e) {
        // Touch event
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      } else {
        // Mouse event
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    },
    []
  );

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      lastPointRef.current = coords;
    },
    [getCoordinates]
  );

  // Draw
  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const coords = getCoordinates(e);
      if (!coords || !lastPointRef.current) return;

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      lastPointRef.current = coords;

      if (!hasSignature) {
        setHasSignature(true);
      }
    },
    [isDrawing, hasSignature, getCoordinates]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPointRef.current = null;

      // Export signature as data URL
      const canvas = canvasRef.current;
      if (canvas && hasSignature) {
        const dataUrl = canvas.toDataURL("image/png");
        onSignatureChange(dataUrl);
      }
    }
  }, [isDrawing, hasSignature, onSignatureChange]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  }, [onSignatureChange]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      stopDrawing();
    }
  }, [isDrawing, stopDrawing]);

  return (
    <div className="signature-pad-container">
      <label className="signature-pad-label">Your Signature</label>
      <div className={`signature-pad-wrapper ${hasSignature ? "has-signature" : ""}`}>
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={handleMouseLeave}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <span className="signature-pad-placeholder">
            Draw your signature here
          </span>
        )}
      </div>
      <div className="signature-pad-actions">
        <button
          type="button"
          className="signature-clear-btn"
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
