export function fmtOdds(x:number){ return x.toFixed(2); }
export function fmtLine(x:number){ return (Math.round(x*2)/2).toString(); }
export function fmtPctInt(x:number){ return `${Math.round(x)}%`; }
export function fmtSignedPct(x:number){
  const s = x>0 ? "+" : "";
  return `${s}${Math.round(x)}%`;
}
export function valueTone(x:number){
  if (x >= 3) return "pos";
  if (x <= -3) return "neg";
  return "neu";
}
