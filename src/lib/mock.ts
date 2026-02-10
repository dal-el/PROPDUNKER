import { BetLine } from "./types";

const teams = ["OLY", "PAN", "PAO", "AEK", "PAOK", "ARIS"];
const props = ["Points", "Rebounds", "Assists", "3PT Made", "PRA", "PR", "PA"];
const books = ["Stoiximan", "Novibet", "Pamestoixima", "Bwin"];

function clamp(n:number, a:number, b:number){ return Math.max(a, Math.min(b, n)); }
function rnd(a:number,b:number){ return a + Math.random()*(b-a); }

function genGames(line:number){
  const n = 15;
  const out = [];
  for(let i=0;i<n;i++){
    const stat = Math.round(rnd(line-6, line+7)*10)/10;
    const minutes = Math.round(rnd(10, 34));
    const day = new Date(Date.now() - (i+1)*86400000*2);
    out.push({
      date: day.toISOString().slice(0,10),
      opp: teams[Math.floor(Math.random()*teams.length)],
      ha: Math.random() > 0.5 ? "H":"A",
      stat,
      minutes
    });
  }
  return out.reverse();
}

export function buildMockLines(): BetLine[] {
  const rows: BetLine[] = [];
  for(let i=0;i<140;i++){
    const player = {
      name: ["Peters", "Fournier", "Milutinov", "Jessup", "Mike", "Obst", "Hall", "Dorsey"][Math.floor(Math.random()*8)] + " " +
            ["Alec","Evan","Nikola","Justin","Isaiah","Andreas","Donta","Tyler"][Math.floor(Math.random()*8)],
      team: teams[Math.floor(Math.random()*teams.length)],
      pos: ["G","SG","SF","PF","C"][Math.floor(Math.random()*5)],
    };

    const isAlt = Math.random() < 0.35;
    const tier = isAlt ? "ALT" : "MAIN";
    const prop = props[Math.floor(Math.random()*props.length)];
    const baseLine = Math.round(rnd(0.5, 29.5)*2)/2;
    const line = clamp(baseLine, 0.5, 39.5);
    const odds = Math.round(rnd(1.35, 2.85)*100)/100;

    const L5 = Math.round(rnd(0.0, 1.0)*100);
    const L10 = Math.round(rnd(0.0, 1.0)*100);
    const L15 = Math.round(rnd(0.0, 1.0)*100);
    const L20 = Math.round(rnd(0.0, 1.0)*100);

    const vL5 = Math.round(rnd(-18, 22));
    const vL10 = Math.round(rnd(-18, 22));
    const vL15 = Math.round(rnd(-18, 22));
    const vL20 = Math.round(rnd(-18, 22));

    const bookmaker = books[Math.floor(Math.random()*books.length)];
    const match = Math.random() < 0.8 ? "upcoming" : "all";

    const games = genGames(line);

    if(tier === "ALT"){
      rows.push({
        id: `ALT-${i}`,
        player,
        prop: { label: prop, tier },
        side: "OVER",
        line,
        odds,
        hit: { L5, L10, L15, L20 },
        value: { vL5, vL10, vL15, vL20 },
        bookmaker,
        match,
        games
      });
    } else {
      // main creates both sides
      rows.push({
        id: `M-${i}-O`,
        player,
        prop: { label: prop, tier },
        side: "OVER",
        line,
        odds,
        hit: { L5, L10, L15, L20 },
        value: { vL5, vL10, vL15, vL20 },
        bookmaker,
        match,
        games
      });
      rows.push({
        id: `M-${i}-U`,
        player,
        prop: { label: prop, tier },
        side: "UNDER",
        line,
        odds,
        hit: { L5: 100-L5, L10: 100-L10, L15: 100-L15, L20: 100-L20 },
        value: { vL5: -vL5, vL10: -vL10, vL15: -vL15, vL20: -vL20 },
        bookmaker,
        match,
        games
      });
    }
  }
  return rows;
}
