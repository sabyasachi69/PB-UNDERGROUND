type JourneyKind = "maker" | "stitch" | "order" | "gate";

export function JourneyVisual({ kind }: { kind: JourneyKind }) {
  return (
    <div className={`journey-mark journey-mark--${kind}`} aria-hidden="true">
      {kind === "maker" && (
        <svg viewBox="0 0 120 120" fill="none">
          <path d="M23 47V99H97V47M18 47L29 24H91L102 47H18Z" />
          <path className="journey-maker-awning" d="M18 47C18 55 29 55 29 47C29 55 40 55 40 47C40 55 51 55 51 47C51 55 62 55 62 47C62 55 73 55 73 47C73 55 84 55 84 47C84 55 95 55 95 47C95 55 102 55 102 47" />
          <path d="M38 99V68H58V99M70 68H86V84H70Z" />
          <circle className="journey-maker-light" cx="78" cy="75" r="3" />
          <path d="M28 24H92" />
        </svg>
      )}
      {kind === "stitch" && (
        <svg viewBox="0 0 120 120" fill="none">
          <path d="M22 22H76L99 45V99H22V22Z" />
          <path d="M76 22V45H99M34 35H62M34 99V35" />
          <path className="journey-stitch-thread" d="M48 58H77V82H48" />
          <path className="journey-stitch-needle" d="M76 47L90 61M74 45L79 50" />
          <circle cx="48" cy="58" r="2" />
        </svg>
      )}
      {kind === "order" && (
        <svg viewBox="0 0 120 120" fill="none">
          <rect x="32" y="13" width="56" height="94" rx="7" />
          <path d="M51 21H69M53 99H67" />
          <g className="journey-order-card">
            <rect x="42" y="38" width="36" height="39" rx="2" />
            <path d="M49 50L60 44L71 50V65L60 71L49 65V50ZM49 50L60 57L71 50M60 57V71" />
          </g>
          <path className="journey-order-confirm" d="M50 85L57 91L71 81" />
        </svg>
      )}
      {kind === "gate" && (
        <svg viewBox="0 0 120 120" fill="none">
          <path d="M20 99V43L60 24L100 43V99M28 44H92M44 99V58H76V99M14 100H106" />
          <path d="M52 58V76M68 58V76" />
          <circle className="journey-gate-arrival" cx="60" cy="88" r="5" />
        </svg>
      )}
    </div>
  );
}

export function DeliveryRouteVisual() {
  const route = "M78 515H176Q205 515 205 485V415Q205 385 235 385H315Q345 385 345 355V270Q345 240 375 240H422V155";

  return (
    <div className="zone-map" aria-hidden="true">
      <span className="zone-map__heading">LOCAL ROUTE / CONCEPT 001</span>
      <svg viewBox="0 0 500 620" fill="none" preserveAspectRatio="xMidYMid meet">
        <g className="zone-map__blocks">
          <path d="M53 102H192V197H53ZM220 80H310V170H220ZM322 67H468V122H322ZM51 244H155V343H51ZM190 224H293V330H190ZM380 308H466V416H380ZM54 410H145V465H54ZM242 445H315V546H242ZM365 477H465V559H365Z" />
          <path d="M48 212H455M170 62V560M329 68V560M50 370H464" />
        </g>
        <path className="zone-map__route-base" d={route} />
        <path className="zone-map__route-trace" d={route} pathLength="100" />
        <circle className="zone-map__origin-halo" cx="78" cy="515" r="17" />
        <circle className="zone-map__origin" cx="78" cy="515" r="6" />
        <circle className="zone-map__destination-halo" cx="422" cy="155" r="22" />
        <path className="zone-map__destination" d="M410 166V146L422 140L434 146V166M414 148H430M419 166V154H425V166" />
        <text x="55" y="481">MAKER</text>
        <text x="374" y="121">YOUR GATE</text>
      </svg>
      <span className="zone-map__footer"><span /> MADE CLOSE. DELIVERED CLOSER.</span>
    </div>
  );
}
