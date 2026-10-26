/** Motif décoratif de lignes fines inspiré du logo (fond du hero uniquement). */
export default function LineMotif({ className }: { className?: string }) {
  const lines = Array.from({ length: 34 }, (_, i) => {
    const t = i / 33;
    const x0 = 20 + t * 330, y0 = -20 + t * 60;
    const c1x = 420 + t * 160, c1y = 80 + t * 120;
    const c2x = 230 - t * 90, c2y = 330 + t * 40;
    const x1 = 250 + t * 300, y1 = 540 + t * 60;
    return <path key={i} d={`M${x0} ${y0} C${c1x} ${c1y} ${c2x} ${c2y} ${x1} ${y1}`} strokeOpacity={0.25 + 0.6 * Math.sin(t * Math.PI)} style={{ ['--i' as string]: i }} />;
  });
  return <svg className={className} viewBox="0 0 560 600" fill="none" stroke="#F29A82" strokeWidth="0.9" aria-hidden="true" focusable="false">{lines}</svg>;
}
