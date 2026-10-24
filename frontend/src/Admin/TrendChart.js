import React, { useState } from "react";

// Grouped columns: requests vs donations per day. Colors validated with the dataviz
// palette checker; deutan separation is in the 6–8 floor band, so identity is also
// carried by fixed bar order, the legend, tooltips and the table view.
const SERIES = [
  { key: "requests", label: "Requests", color: "var(--chart-requests)" },
  { key: "donations", label: "Donations", color: "var(--chart-donations)" },
];

const W = 720;
const H = 220;
const PAD = { top: 16, right: 8, bottom: 28, left: 32 };
const BAR = 12; // ≤ 24px, leaves air in each band
const GAP = 2; // surface gap between the two bars of a day

const niceMax = (v) => {
  if (v <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / step) * step;
};

// Column with 4px rounded data-end and a square baseline.
const barPath = (x, y, w, h) => {
  if (h <= 0) return "";
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};

const fmtDay = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, opts);

const TrendChart = ({ data }) => {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  if (!data?.length) return null;

  const max = niceMax(Math.max(1, ...data.flatMap((d) => [d.requests, d.donations])));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const band = innerW / data.length;
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max].map((t) => Math.round(t));
  const totals = SERIES.map((s) => data.reduce((n, d) => n + d[s.key], 0));

  return (
    <section className="chart-card" aria-labelledby="trend-title">
      <div className="chart-head">
        <div>
          <h2 id="trend-title">Activity, last 14 days</h2>
          <ul className="chart-legend">
            {SERIES.map((s, i) => (
              <li key={s.key}>
                <span className="legend-swatch" style={{ background: s.color }} aria-hidden="true" />
                {s.label} <strong>{totals[i]}</strong>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsTable((t) => !t)} aria-pressed={asTable}>
          <i className={`fa-solid ${asTable ? "fa-chart-column" : "fa-table"}`} aria-hidden="true" /> {asTable ? "Chart" : "Table"}
        </button>
      </div>

      {asTable ? (
        <div className="table-wrap">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Date</th>
                {SERIES.map((s) => (
                  <th key={s.key}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date}>
                  <td>{fmtDay(d.date, { weekday: "short", day: "numeric", month: "short" })}</td>
                  {SERIES.map((s) => (
                    <td key={s.key}>{d[s.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-wrap" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Requests and donations per day for the last 14 days. ${totals[0]} requests and ${totals[1]} donations in total.`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-axis">
                  {t}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = PAD.left + band * i + band / 2;
              const x0 = cx - BAR - GAP / 2;
              return (
                <g key={d.date}>
                  {hover === i && <rect x={PAD.left + band * i} y={PAD.top} width={band} height={innerH} className="chart-hover-band" />}
                  {SERIES.map((s, si) => {
                    const v = d[s.key];
                    return <path key={s.key} d={barPath(x0 + si * (BAR + GAP), y(v), BAR, PAD.top + innerH - y(v))} fill={s.color} />;
                  })}
                  {(i % 2 === 1 || data.length <= 7) && (
                    <text x={cx} y={H - 8} textAnchor="middle" className="chart-axis">
                      {fmtDay(d.date, { day: "numeric", month: "short" })}
                    </text>
                  )}
                  {/* Hit target spans the whole day band, larger than the bars. */}
                  <rect
                    x={PAD.left + band * i}
                    y={PAD.top}
                    width={band}
                    height={innerH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${fmtDay(d.date, { day: "numeric", month: "long" })}: ${d.requests} requests, ${d.donations} donations`}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                  />
                </g>
              );
            })}
            <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} className="chart-baseline" />
          </svg>
          {hover !== null && (
            <div
              className="chart-tooltip"
              style={{
                left: `${((PAD.left + band * hover + band / 2) / W) * 100}%`,
                transform: hover > data.length / 2 ? "translateX(-105%)" : "translateX(5%)",
              }}
              role="status"
            >
              <strong>{fmtDay(data[hover].date, { weekday: "short", day: "numeric", month: "short" })}</strong>
              {SERIES.map((s) => (
                <span key={s.key}>
                  <i className="legend-swatch" style={{ background: s.color }} aria-hidden="true" /> {s.label}
                  <b>{data[hover][s.key]}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TrendChart;
