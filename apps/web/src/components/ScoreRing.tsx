interface Props {
  value: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}

export function scoreColor(value: number) {
  if (value >= 80) return "#4ade80";
  if (value >= 60) return "#a3e635";
  if (value >= 40) return "#fbbf24";
  return "#f87171";
}

export function ScoreRing({ value, size = 44, stroke = 4, showLabel = true }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  const color = scoreColor(value);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Match score ${value} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute inset-0 grid place-items-center font-semibold tabular-nums"
          style={{ fontSize: size * 0.3, color }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
