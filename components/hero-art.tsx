export function HeroArt() {
  return (
    <div
      className="hero-art"
      role="img"
      aria-label="A field of converging monochrome trajectories pointing toward a shared horizon"
    >
      <svg viewBox="0 0 780 680" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id="trajectory"
            x1="100"
            y1="600"
            x2="620"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" stopOpacity="0" />
            <stop offset=".48" stopColor="#fff" stopOpacity=".4" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
        </defs>
        <g stroke="url(#trajectory)" strokeWidth=".8">
          {Array.from({ length: 42 }, (_, i) => (
            <path
              key={i}
              d={`M ${-140 + i * 19} 720 C ${190 + i * 8} ${560 - i * 3}, ${360 + i * 6} ${130 + i * 4}, ${790} ${-80 + i * 18}`}
            />
          ))}
        </g>
        <g stroke="#fff" opacity=".5">
          <path d="M290 520L550 170M398 590L658 240" strokeDasharray="2 9" />
          <circle cx="550" cy="170" r="6" />
          <circle cx="398" cy="590" r="3" />
        </g>
        <path
          className="art-trace"
          d="M90 720C286 524 432 166 790 226"
          stroke="white"
          strokeWidth="2"
        />
        <g fill="#fff" fontFamily="monospace" fontSize="9" opacity=".65">
          <text x="558" y="155">
            FORWARD / 01
          </text>
          <text x="410" y="612">
            POSSIBILITY →
          </text>
        </g>
      </svg>
      <span className="art-coordinate">A STUDY IN FORWARD MOTION</span>
    </div>
  );
}
