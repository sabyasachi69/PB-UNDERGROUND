"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type SceneKind = "collection" | "layers" | "shirts" | "bottoms" | "essentials" | "delivery" | "maker" | "fabric" | "message" | "document" | "bag";

const scenes: Record<SceneKind, { src: string; action: string; code: string }> = {
  collection: { src: "/images/hero/garment-stack.png", action: "Replay the garment stack animation", code: "DROP / 001" },
  layers: { src: "/images/hero/category-layer-hoodie.png", action: "Replay the layered outfit animation", code: "LAYER / BUILD" },
  shirts: { src: "/images/hero/category-shirt.png", action: "Replay the shirt opening animation", code: "SHIRT / STRUCTURE" },
  bottoms: { src: "/images/hero/category-bottoms.png", action: "Replay the cargo pants stride animation", code: "BOTTOM / MOVE" },
  essentials: { src: "/images/hero/category-essentials.png", action: "Replay the everyday essentials animation", code: "DAILY / KIT" },
  delivery: { src: "/images/hero/delivery-scooter.png", action: "Replay the scooter delivery animation", code: "ROUTE / LPU" },
  maker: { src: "/images/hero/maker-counter.png", action: "Replay the maker counter animation", code: "MADE / CLOSE" },
  fabric: { src: "/images/hero/fabric-roll.png", action: "Replay the fabric animation", code: "FROM / HERE" },
  message: { src: "/images/hero/message-envelope.png", action: "Replay the message animation", code: "SAY / HELLO" },
  document: { src: "/images/hero/message-envelope.png", action: "Replay the document animation", code: "POLICY / DRAFT" },
  bag: { src: "/images/hero/canvas-tote.png", action: "Replay the canvas bag animation", code: "TAKE / ALONG" },
};

export function HeaderScene({ kind }: { kind: SceneKind }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);
  const scene = scenes[kind];

  useEffect(() => {
    const element = sceneRef.current;
    const host = element?.parentElement;
    if (!element || !host) return;

    let frame: number | null = null;
    let x = 0;
    let y = 0;
    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      element.style.setProperty("--scene-rx", "0deg");
      element.style.setProperty("--scene-ry", "0deg");
      element.style.setProperty("--scene-x", "0px");
      element.style.setProperty("--scene-y", "0px");
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      x = event.clientX;
      y = event.clientY;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const bounds = host.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const nx = Math.max(-1, Math.min(1, ((x - bounds.left) / bounds.width - 0.5) * 2));
        const ny = Math.max(-1, Math.min(1, ((y - bounds.top) / bounds.height - 0.5) * 2));
        element.style.setProperty("--scene-rx", `${(-ny * 8).toFixed(1)}deg`);
        element.style.setProperty("--scene-ry", `${(nx * 11).toFixed(1)}deg`);
        element.style.setProperty("--scene-x", `${(nx * 9).toFixed(1)}px`);
        element.style.setProperty("--scene-y", `${(ny * 6).toFixed(1)}px`);
      });
    };

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", reset);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", reset);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={`header-scene header-scene--${kind}`} ref={sceneRef}>
      <span className="header-scene__orbit header-scene__orbit--outer" aria-hidden="true" />
      <span className="header-scene__orbit header-scene__orbit--inner" aria-hidden="true" />
      <span className="header-scene__route" aria-hidden="true" />
      <span className="header-scene__dust" aria-hidden="true" key={`dust-${replay}`}><i /><i /><i /><i /></span>
      <div className="header-scene__motion" key={replay}>
        <div className="header-scene__tilt">
          <button type="button" className="header-scene__button" aria-label={scene.action} onClick={() => setReplay((current) => current + 1)}>
            {kind === "layers" ? (
              <>
                <span className="header-scene__layer header-scene__layer--tee"><Image src="/images/hero/category-layer-tee.png" alt="" fill sizes="(max-width: 700px) 60vw, 31vw" priority className="header-scene__image" /></span>
                <span className="header-scene__layer header-scene__layer--shirt"><Image src="/images/hero/category-shirt.png" alt="" fill sizes="(max-width: 700px) 60vw, 31vw" priority className="header-scene__image" /></span>
                <span className="header-scene__layer header-scene__layer--hoodie"><Image src={scene.src} alt="" fill sizes="(max-width: 700px) 60vw, 31vw" priority className="header-scene__image" /></span>
              </>
            ) : (
              <Image src={scene.src} alt="" fill sizes="(max-width: 700px) 85vw, 45vw" priority className="header-scene__image" />
            )}
          </button>
        </div>
      </div>
      <span className="header-scene__code" aria-hidden="true">{scene.code} / CONCEPT VISUAL</span>
      <span className="header-scene__hint" aria-hidden="true">Move to tilt · tap to replay</span>
    </div>
  );
}
