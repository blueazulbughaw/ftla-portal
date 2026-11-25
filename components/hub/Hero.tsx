// The banner at the top of every hub page.
export default function Hero({ kicker, title, intro }: { kicker: string; title: string; intro?: string }) {
  return (
    <section className="hub-hero">
      <div className="hub-hero-text">
        <p className="hub-kicker">{kicker}</p>
        <h1>{title}</h1>
        {intro && <p className="intro">{intro}</p>}
      </div>
      <svg className="hub-hero-art" viewBox="0 0 320 160" aria-hidden="true">
        <circle cx="250" cy="70" r="58" fill="var(--yellow)" />
        <circle cx="178" cy="112" r="34" fill="var(--orange)" opacity="0.9" />
        <circle cx="296" cy="128" r="26" fill="var(--green)" />
        <circle cx="140" cy="48" r="18" fill="var(--blue)" />
        <path d="M0 160 L0 132 L30 132 L30 104 L52 104 L52 120 L74 120 L74 84 L96 84 L96 124 L120 124 L120 96 L138 96 L138 140 L170 140 L170 118 L196 118 L196 150 L230 150 L230 126 L262 126 L262 146 L320 146 L320 160 Z" fill="var(--fg)" opacity="0.08" />
      </svg>
    </section>
  );
}
