from pathlib import Path
from html import escape
import csv

root = Path(__file__).resolve().parents[2]
csv_path = root / "results" / "csv" / "scalability.csv"
chart_dir = root / "results" / "charts"
chart_dir.mkdir(parents=True, exist_ok=True)
with csv_path.open(newline="", encoding="utf-8") as stream:
    rows = list(csv.DictReader(stream))
volumes = [int(row["volume"]) for row in rows]
charts = [
    ("average_issuance_latency_ms", "Average issuance latency (ms)", "volume-vs-issuance-latency.svg", "#3157d5"),
    ("tps", "Confirmed issuance throughput (TPS)", "volume-vs-tps.svg", "#188267"),
    ("success_rate_percent", "Success rate (%)", "volume-vs-success-rate.svg", "#b7791f"),
    ("total_gas", "Total gas", "volume-vs-total-gas.svg", "#6b4fd3"),
]
for key, label, filename, color in charts:
    values = [float(row[key]) for row in rows]
    width, height = 900, 520
    left, right, top, bottom = 90, 40, 70, 70
    plot_w, plot_h = width - left - right, height - top - bottom
    min_v, max_v = min(values), max(values)
    span = max(max_v - min_v, abs(max_v) * 0.1, 1)
    low, high = max(0, min_v - span * 0.15), max_v + span * 0.15
    x_min, x_max = min(volumes), max(volumes)
    x_span = max(x_max - x_min, 1)
    points = [(left + (volume - x_min) / x_span * plot_w, top + (high - value) / (high - low) * plot_h) for volume, value in zip(volumes, values)]
    path = " ".join(f"{'M' if i == 0 else 'L'} {x:.1f} {y:.1f}" for i, (x, y) in enumerate(points))
    grid = []
    for tick in range(5):
        y = top + tick * plot_h / 4
        value = high - tick * (high - low) / 4
        grid.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width-right}" y2="{y:.1f}" stroke="#dce2ee"/><text x="{left-12}" y="{y+4:.1f}" text-anchor="end" fill="#63708a" font-size="12">{value:,.2f}</text>')
    x_labels = "".join(f'<text x="{x:.1f}" y="{height-bottom+28}" text-anchor="middle" fill="#63708a" font-size="12">{volume}</text>' for (x, _), volume in zip(points, volumes))
    markers = "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="white" stroke="{color}" stroke-width="3"/><text x="{x:.1f}" y="{y-12:.1f}" text-anchor="middle" fill="#142039" font-size="11">{value:,.2f}</text>' for (x, y), value in zip(points, values))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(label)} by certificate volume</title><desc id="desc">Measured local Hardhat benchmark results.</desc><rect width="100%" height="100%" fill="white"/><text x="{left}" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#101c36">{escape(label)}</text><g font-family="Arial, sans-serif">{''.join(grid)}{x_labels}<path d="{path}" fill="none" stroke="{color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>{markers}<text x="{left+plot_w/2}" y="{height-16}" text-anchor="middle" fill="#63708a" font-size="13">Certificate volume</text></g></svg>'''
    (chart_dir / filename).write_text(svg, encoding="utf-8")
