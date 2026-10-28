"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { RotateCw } from "lucide-react";

export function HeroArtifact() {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const stage = stageRef.current;
      if (!stage) return;
      stage.style.setProperty("--tilt-x", `${(-y * 13).toFixed(2)}deg`);
      stage.style.setProperty("--tilt-y", `${(x * 17).toFixed(2)}deg`);
      stage.style.setProperty("--light-x", `${((x + 1) * 50).toFixed(1)}%`);
      stage.style.setProperty("--light-y", `${((y + 1) * 50).toFixed(1)}%`);
    });
  }

  function reset() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--tilt-x", "-5deg");
    stage.style.setProperty("--tilt-y", "-10deg");
    stage.style.setProperty("--light-x", "50%");
    stage.style.setProperty("--light-y", "35%");
  }

  return (
    <div className="hero-art" ref={stageRef} onPointerMove={move} onPointerLeave={reset}>
      <span className="hero-art-corner">PB / OBJECT 001</span>
      <span className="hero-art-disc" aria-hidden="true" />
      <span className="hero-art-cut" aria-hidden="true" />
      <span className="hero-art-stitch" aria-hidden="true" />

      <div className="hero-art-float">
        <div className="hero-art-tilt">
          <button
            type="button"
            className={`hero-art-card${flipped ? " is-flipped" : ""}`}
            aria-label={flipped ? "Show the front of the PB garment label" : "Turn the PB garment label to see its story"}
            aria-pressed={flipped}
            onClick={() => setFlipped((current) => !current)}
          >
            <span className="hero-art-face hero-art-face--front" aria-hidden="true">
              <span className="hero-art-face-top"><span>PB UNDERGROUND<br />FIELD LABEL / 001</span><i /></span>
              <strong>PB<br />UNDER<br />GROUND</strong>
              <span className="hero-art-face-bottom">Made close.<br />Worn everywhere. <RotateCw size={20} strokeWidth={1.8} /></span>
            </span>
            <span className="hero-art-face hero-art-face--back" aria-hidden="true">
              <span className="hero-art-back-top">THE INSIDE STORY <span>01 / 01</span></span>
              <strong>Made by<br />neighbours.<br /><em>Worn by you.</em></strong>
              <span className="hero-art-back-rule" />
              <span className="hero-art-back-bottom">SMALL RUNS / LOCAL HANDS<br />YOUR CAMPUS / YOUR DROP POINT</span>
              <span className="hero-art-back-mark">PB / UND / GRND</span>
            </span>
            <span className="hero-art-edge hero-art-edge--top" aria-hidden="true" />
            <span className="hero-art-edge hero-art-edge--bottom" aria-hidden="true" />
            <span className="hero-art-edge hero-art-edge--left" aria-hidden="true" />
            <span className="hero-art-edge hero-art-edge--right" aria-hidden="true" />
          </button>
        </div>
      </div>

      <span className="hero-art-instruction"><RotateCw size={15} aria-hidden="true" /><span className="hero-art-instruction-desktop">Move to explore / click to turn</span><span className="hero-art-instruction-touch">Tap label to turn</span></span>
      <span className="hero-art-caption">Concept object · sample collection below</span>
    </div>
  );
}
