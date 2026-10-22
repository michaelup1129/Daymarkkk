export function constellationPoints(data: [string, number][]) {
  // A dedicated SVG drawing region sits BELOW a normal-flow header.
  // Bounds include glow radius and emoji height, independently of pixel width.
  const n = Math.min(data.length, 18);
  return data.slice(0, n).map(([emoji, count], i) => {
    const angle = i * 2.399963;
    const radius = Math.sqrt((i + 0.6) / (n + 0.4)) * 30;
    return {
      emoji,
      count,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      r: 2.2 + 4.5 * Math.sqrt(count / Math.max(1, ...data.map((d) => d[1]))),
    };
  });
}
