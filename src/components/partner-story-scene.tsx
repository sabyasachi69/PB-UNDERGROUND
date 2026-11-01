"use client";

import { Check, PackageCheck, ReceiptText, Shirt, ShoppingBag, Smartphone } from "lucide-react";
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
      scene.style.setProperty("--story-x", "0px");
      scene.style.setProperty("--story-y", "0px");
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
        scene.style.setProperty("--story-x", `${(x * 7).toFixed(1)}px`);
        scene.style.setProperty("--story-y", `${(y * 5).toFixed(1)}px`);
        scene.style.setProperty("--story-rotate-x", `${(-y * 5).toFixed(1)}deg`);
        scene.style.setProperty("--story-rotate-y", `${(x * 7).toFixed(1)}deg`);
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
          <div className="partner-story__route partner-story__route--out" />
          <div className="partner-story__route partner-story__route--back" />

          <div className="partner-story__place partner-story__place--shop">
            <span className="partner-story__number">01 / LOCAL SHOP</span>
            <div className="partner-story__illustration partner-story__illustration--shop">
              <span className="partner-story__awning"><i /><i /><i /><i /><i /></span>
              <span className="partner-story__shop-window"><Shirt strokeWidth={1.45} /></span>
              <span className="partner-story__shop-door" />
              <span className="partner-story__shop-sign">LOCAL SHOP</span>
            </div>
            <strong>Local store</strong>
            <small>Lists a piece</small>
          </div>

          <div className="partner-story__hub">
            <span>PB</span>
            <small>UNDERGROUND</small>
          </div>

          <div className="partner-story__place partner-story__place--student">
            <span className="partner-story__number">02 / CAMPUS</span>
            <div className="partner-story__illustration partner-story__illustration--student">
              <span className="partner-story__campus-arch" />
              <span className="partner-story__person-head" />
              <span className="partner-story__person-body" />
              <span className="partner-story__person-phone"><Smartphone strokeWidth={2} /></span>
              <span className="partner-story__campus-label">CAMPUS</span>
            </div>
            <strong>Student</strong>
            <small>Finds their fit</small>
          </div>

          <span className="partner-story__garment"><Shirt strokeWidth={1.7} /><small>DISCOVERED</small></span>
          <span className="partner-story__order"><ShoppingBag strokeWidth={1.8} /><small>ORDER PLACED</small></span>
          <span className="partner-story__confirmed"><PackageCheck strokeWidth={1.7} /> Ready for pickup</span>
          <span className="partner-story__settlement"><ReceiptText strokeWidth={1.6} /><span><b>Sale recorded</b><small>Clear weekly statement</small></span><Check strokeWidth={2} /></span>
        </div>

        <div className="partner-story__caption" aria-hidden="true">
          <span className="partner-story__caption--one"><b>01</b> A local shop lists a piece students will actually wear.</span>
          <span className="partner-story__caption--two"><b>02</b> A student finds it between classes.</span>
          <span className="partner-story__caption--three"><b>03</b> The order goes straight to the store.</span>
          <span className="partner-story__caption--four"><b>04</b> One local sale. One campus connection.</span>
        </div>
      </div>

      <p className="sr-only">A local store lists clothing on PB UNDERGROUND. A student discovers and orders it on campus. The order reaches the store, then the sale appears in a clear weekly statement. This is a sample program illustration.</p>
      <div className="partner-story__footer">
        <span>LOCAL STORE → PB → STUDENT / CONCEPT STORY</span>
        <button type="button" onClick={() => setReplay((current) => current + 1)}>Replay story <span aria-hidden="true">↻</span></button>
      </div>
    </div>
  );
}
