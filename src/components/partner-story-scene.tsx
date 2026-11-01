"use client";

import { GraduationCap, Shirt, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function PartnerStoryScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let frame: number | null = null;
    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      scene.style.setProperty("--story-rotate-x", "0deg");
      scene.style.setProperty("--story-rotate-y", "0deg");
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = scene.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
        const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
        scene.style.setProperty("--story-rotate-x", `${(-y * 3).toFixed(1)}deg`);
        scene.style.setProperty("--story-rotate-y", `${(x * 4).toFixed(1)}deg`);
        frame = null;
      });
    };

    scene.addEventListener("pointermove", move);
    scene.addEventListener("pointerleave", reset);
    return () => {
      scene.removeEventListener("pointermove", move);
      scene.removeEventListener("pointerleave", reset);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="header-scene partner-story" ref={sceneRef}>
      <div className="partner-story__stage" key={replay}>
        <div className="partner-story__world" aria-hidden="true">
          <span className="partner-story__line" />
          <span className="partner-story__piece"><Shirt strokeWidth={1.7} /></span>
          <span className="partner-story__order" />
          <div className="partner-story__node partner-story__node--store">
            <span className="partner-story__icon"><Store strokeWidth={1.4} /></span>
            <strong>Your store</strong>
          </div>
          <div className="partner-story__node partner-story__node--pb">
            <span className="partner-story__brand">PB</span>
            <strong>Underground</strong>
          </div>
          <div className="partner-story__node partner-story__node--student">
            <span className="partner-story__icon"><GraduationCap strokeWidth={1.4} /></span>
            <strong>Student</strong>
          </div>
        </div>
        <div className="partner-story__caption" aria-hidden="true">
          <span className="partner-story__caption--one">Your store lists a piece.</span>
          <span className="partner-story__caption--two">A student discovers it.</span>
          <span className="partner-story__caption--three">Their order comes to you.</span>
          <span className="partner-story__caption--four">Your store. Their campus. Connected.</span>
        </div>
      </div>
      <p className="sr-only">Your store lists a piece on PB UNDERGROUND. A student discovers it on campus and places an order that comes to your store. This is a sample program illustration.</p>
      <button className="partner-story__replay" type="button" onClick={() => setReplay((current) => current + 1)}>Replay story <span aria-hidden="true">↻</span></button>
    </div>
  );
}
