import { useEffect, useMemo, useRef, useState } from "react";

// Offline UCL + FUT.GG-style database.


const ATTRS = [
  { id: "pace", label: "Pace", icon: "⚡", desc: "55% sprint speed + 45% acceleration" },
  { id: "shooting", label: "Shooting", icon: "🎯", desc: "Finishing, shot power, long shots + extras" },
  { id: "passing", label: "Passing", icon: "🎨", desc: "Short pass, vision, crossing + curve" },
  { id: "dribbling", label: "Dribbling", icon: "🪄", desc: "Skill dribbling + ball control weighted" },
  { id: "defending", label: "Defending", icon: "🛡️", desc: "Awareness, tackles, interceptions" },
  { id: "physical", label: "Physical", icon: "💪", desc: "Strength, stamina, aggression + jumping" },
];

function clamp(n) { return Math.max(1, Math.min(99, Math.round(n))); }
function weighted(parts) {
  return clamp(parts.reduce((sum, [value, weight]) => sum + value * weight, 0));
}
function inferUnderlying(card) {
  // Editable FUT.GG-style base values. The game now stores underlying attributes,
  // then recalculates visible card stats using winger-specific formulas.
  const s = card.shooting, pa = card.passing, d = card.dribbling, de = card.defending, ph = card.physical, pc = card.pace;
  return {
    acceleration: clamp(pc - 1), sprintSpeed: clamp(pc + 1),
    finishing: clamp(s + 2), shotPower: clamp(s), longShots: clamp(s - 1), positioning: clamp(s + 3), penalties: clamp(s - 8), volleys: clamp(s - 4),
    shortPass: clamp(pa + 1), vision: clamp(pa + 2), crossing: clamp(pa + 2), longPass: clamp(pa - 2), curve: clamp(pa + 1), freeKickAccuracy: clamp(pa - 8),
    dribblingSkill: clamp(d + 1), ballControl: clamp(d), agility: clamp(d + 2), balance: clamp(d - 1), reactions: clamp(d - 1), composure: clamp(d - 2),
    defensiveAwareness: clamp(de), standingTackle: clamp(de + 1), interceptions: clamp(de), headingAccuracy: clamp(de - 5), slidingTackle: clamp(de - 3),
    strength: clamp(ph), stamina: clamp(ph + 2), aggression: clamp(ph - 1), jumping: clamp(ph - 3)
  };
}
function calcCardStats(u) {
  return {
    pace: weighted([[u.sprintSpeed,0.55],[u.acceleration,0.45]]),
    shooting: weighted([[u.finishing,0.45],[u.shotPower,0.20],[u.longShots,0.20],[u.positioning,0.05],[u.penalties,0.05],[u.volleys,0.05]]),
    passing: weighted([[u.shortPass,0.35],[u.vision,0.20],[u.crossing,0.20],[u.longPass,0.15],[u.curve,0.05],[u.freeKickAccuracy,0.05]]),
    dribbling: weighted([[u.dribblingSkill,0.49],[u.ballControl,0.34],[u.agility,0.10],[u.balance,0.05],[u.reactions,0.03],[u.composure,0.02]]),
    defending: weighted([[u.defensiveAwareness,0.30],[u.standingTackle,0.30],[u.interceptions,0.20],[u.headingAccuracy,0.10],[u.slidingTackle,0.10]]),
    physical: weighted([[u.strength,0.50],[u.stamina,0.25],[u.aggression,0.20],[u.jumping,0.05]])
  };
}
function wingerOVRFromStats(stats) {
  return weighted([[stats.dribbling,0.28],[stats.pace,0.22],[stats.passing,0.21],[stats.shooting,0.17],[stats.physical,0.08],[stats.defending,0.04]]);
}
function p(name, position, ignoredOverall, baseStats) {
  const underlying = inferUnderlying(baseStats);
  const stats = calcCardStats(underlying);
  return { name, position, overall: wingerOVRFromStats(stats), stats, underlying };
}

const CLUBS = [
  { id:"ARS", name:"Arsenal", country:"ENG", color:"#EF0107", players:[
    p("Bukayo Saka","RW",0,{pace:86,shooting:84,passing:87,dribbling:90,defending:62,physical:74}),
    p("Gabriel Martinelli","LW",0,{pace:90,shooting:80,passing:78,dribbling:85,defending:49,physical:72}),
    p("Leandro Trossard","LW",0,{pace:76,shooting:83,passing:82,dribbling:86,defending:45,physical:66}),
  ]},
  { id:"AVL", name:"Aston Villa", country:"ENG", color:"#670E36", players:[
    p("Morgan Rogers","LW",0,{pace:82,shooting:83,passing:80,dribbling:84,defending:52,physical:80}),
    p("Leon Bailey","RW",0,{pace:90,shooting:78,passing:77,dribbling:85,defending:39,physical:67}),
    p("Jacob Ramsey","LM",0,{pace:79,shooting:75,passing:78,dribbling:82,defending:61,physical:73}),
  ]},
  { id:"ATM", name:"Atlético Madrid", country:"ESP", color:"#CE3524", players:[
    p("Giuliano Simeone","RM",0,{pace:85,shooting:76,passing:74,dribbling:80,defending:55,physical:73}),
    p("Samuel Lino","LM",0,{pace:86,shooting:77,passing:76,dribbling:84,defending:62,physical:71}),
    p("Rodrigo Riquelme","LM",0,{pace:82,shooting:75,passing:79,dribbling:82,defending:58,physical:66}),
  ]},
  { id:"BVB", name:"Borussia Dortmund", country:"GER", color:"#FDE100", players:[
    p("Karim Adeyemi","LW",0,{pace:96,shooting:78,passing:72,dribbling:84,defending:36,physical:68}),
    p("Jamie Gittens","LW",0,{pace:89,shooting:74,passing:71,dribbling:85,defending:30,physical:57}),
    p("Julien Duranville","RW",0,{pace:86,shooting:69,passing:66,dribbling:79,defending:28,physical:56}),
  ]},
  { id:"BAR", name:"Barcelona", country:"ESP", color:"#A50044", players:[
    p("Lamine Yamal","RW",0,{pace:88,shooting:90,passing:87,dribbling:91,defending:24,physical:54}),
    p("Raphinha","LW",0,{pace:91,shooting:85,passing:85,dribbling:88,defending:57,physical:78}),
    p("Ferran Torres","LW",0,{pace:83,shooting:83,passing:79,dribbling:81,defending:42,physical:70}),
  ]},
  { id:"BAY", name:"Bayern München", country:"GER", color:"#DC052D", players:[
    p("Michael Olise","RW",0,{pace:81,shooting:83,passing:86,dribbling:89,defending:47,physical:66}),
    p("Luis Díaz","LW",0,{pace:91,shooting:83,passing:80,dribbling:88,defending:45,physical:75}),
    p("Serge Gnabry","RW",0,{pace:83,shooting:84,passing:79,dribbling:83,defending:43,physical:70}),
  ]},
  { id:"BRU", name:"Club Brugge", country:"BEL", color:"#0034A4", players:[
    p("Christos Tzolis","LW",0,{pace:84,shooting:78,passing:74,dribbling:81,defending:34,physical:68}),
    p("Chemsdine Talbi","RW",0,{pace:82,shooting:70,passing:69,dribbling:76,defending:31,physical:55}),
    p("Michał Skóraś","LW",0,{pace:82,shooting:70,passing:69,dribbling:76,defending:42,physical:64}),
  ]},
  { id:"COM", name:"Como", country:"ITA", color:"#0055A4", players:[
    p("Assane Diao","LW",0,{pace:86,shooting:74,passing:70,dribbling:80,defending:34,physical:70}),
    p("Jayden Addai","RW",0,{pace:84,shooting:69,passing:67,dribbling:77,defending:28,physical:57}),
    p("Jonathan Ikoné","RW",0,{pace:82,shooting:75,passing:76,dribbling:82,defending:36,physical:60}),
  ]},
  { id:"FEY", name:"Feyenoord", country:"NED", color:"#D00000", players:[
    p("Anis Hadj Moussa","RW",0,{pace:84,shooting:73,passing:71,dribbling:82,defending:34,physical:62}),
    p("Leo Sauer","LW",0,{pace:83,shooting:70,passing:68,dribbling:78,defending:30,physical:56}),
    p("Jaden Slory","LW",0,{pace:82,shooting:68,passing:66,dribbling:76,defending:27,physical:55}),
  ]},
  { id:"GAL", name:"Galatasaray", country:"TUR", color:"#E8192C", players:[
    p("Barış Alper Yılmaz","RW",0,{pace:88,shooting:77,passing:74,dribbling:80,defending:55,physical:83}),
    p("Yunus Akgün","RW",0,{pace:83,shooting:74,passing:76,dribbling:81,defending:35,physical:58}),
    p("Nicolò Zaniolo","RW",0,{pace:82,shooting:80,passing:77,dribbling:82,defending:44,physical:80}),
  ]},
  { id:"INT", name:"Inter", country:"ITA", color:"#010E80", players:[
    p("Federico Dimarco","LM",0,{pace:80,shooting:78,passing:87,dribbling:82,defending:78,physical:76}),
    p("Denzel Dumfries","RM",0,{pace:83,shooting:73,passing:75,dribbling:78,defending:80,physical:86}),
    p("Carlos Augusto","LM",0,{pace:80,shooting:73,passing:78,dribbling:80,defending:78,physical:80}),
  ]},
  { id:"RBL", name:"Leipzig", country:"GER", color:"#DD0741", players:[
    p("Antonio Nusa","LW",0,{pace:87,shooting:72,passing:71,dribbling:83,defending:31,physical:55}),
    p("Johan Bakayoko","RW",0,{pace:86,shooting:77,passing:76,dribbling:85,defending:34,physical:66}),
    p("Yan Diomande","LW",0,{pace:86,shooting:70,passing:68,dribbling:79,defending:30,physical:58}),
  ]},
  { id:"LEN", name:"Lens", country:"FRA", color:"#D71920", players:[
    p("Anass Zaroury","LW",0,{pace:80,shooting:74,passing:76,dribbling:80,defending:38,physical:58}),
    p("Florian Sotoca","RW",0,{pace:68,shooting:76,passing:78,dribbling:76,defending:59,physical:77}),
    p("Wesley Saïd","LW",0,{pace:82,shooting:75,passing:69,dribbling:77,defending:35,physical:70}),
  ]},
  { id:"LIL", name:"Lille", country:"FRA", color:"#D71920", players:[
    p("Osame Sahraoui","LW",0,{pace:84,shooting:73,passing:74,dribbling:83,defending:31,physical:56}),
    p("Matias Fernandez-Pardo","LW",0,{pace:82,shooting:71,passing:69,dribbling:78,defending:30,physical:56}),
    p("Hákon Arnar Haraldsson","LW",0,{pace:78,shooting:75,passing:78,dribbling:81,defending:44,physical:62}),
  ]},
  { id:"LIV", name:"Liverpool", country:"ENG", color:"#C8102E", players:[
    p("Mohamed Salah","RW",0,{pace:89,shooting:88,passing:84,dribbling:89,defending:45,physical:76}),
    p("Cody Gakpo","LW",0,{pace:82,shooting:84,passing:81,dribbling:84,defending:43,physical:78}),
    p("Federico Chiesa","RW",0,{pace:87,shooting:82,passing:78,dribbling:84,defending:42,physical:68}),
  ]},
  { id:"MCI", name:"Man City", country:"ENG", color:"#6CABDD", players:[
    p("Jérémy Doku","LW",0,{pace:92,shooting:76,passing:77,dribbling:89,defending:35,physical:65}),
    p("Savinho","RW",0,{pace:88,shooting:78,passing:79,dribbling:87,defending:40,physical:60}),
    p("Phil Foden","RW",0,{pace:84,shooting:87,passing:87,dribbling:91,defending:58,physical:63}),
  ]},
  { id:"MUN", name:"Man Utd", country:"ENG", color:"#DA291C", players:[
    p("Amad Diallo","RW",0,{pace:84,shooting:79,passing:79,dribbling:85,defending:45,physical:59}),
    p("Bryan Mbeumo","RW",0,{pace:85,shooting:82,passing:79,dribbling:82,defending:49,physical:76}),
    p("Alejandro Garnacho","LW",0,{pace:88,shooting:80,passing:74,dribbling:85,defending:35,physical:64}),
  ]},
  { id:"NAP", name:"Napoli", country:"ITA", color:"#087DC2", players:[
    p("David Neres","RW",0,{pace:87,shooting:77,passing:78,dribbling:86,defending:35,physical:59}),
    p("Noa Lang","LW",0,{pace:83,shooting:78,passing:79,dribbling:85,defending:35,physical:60}),
    p("Matteo Politano","RW",0,{pace:80,shooting:80,passing:81,dribbling:85,defending:46,physical:60}),
  ]},
  { id:"PSG", name:"Paris Saint-Germain", country:"FRA", color:"#004170", players:[
    p("Ousmane Dembélé","RW",0,{pace:91,shooting:85,passing:85,dribbling:91,defending:38,physical:62}),
    p("Khvicha Kvaratskhelia","LW",0,{pace:85,shooting:84,passing:83,dribbling:89,defending:43,physical:74}),
    p("Bradley Barcola","LW",0,{pace:90,shooting:81,passing:80,dribbling:88,defending:37,physical:66}),
  ]},
  { id:"POR", name:"Porto", country:"POR", color:"#003DA5", players:[
    p("Pepê","RW",0,{pace:83,shooting:74,passing:78,dribbling:84,defending:66,physical:68}),
    p("Rodrigo Mora","RW",0,{pace:78,shooting:76,passing:78,dribbling:83,defending:38,physical:54}),
    p("Gabriel Veron","LW",0,{pace:85,shooting:74,passing:70,dribbling:80,defending:32,physical:60}),
  ]},
  { id:"PSV", name:"PSV", country:"NED", color:"#CC0000", players:[
    p("Ivan Perišić","LW",0,{pace:75,shooting:80,passing:82,dribbling:80,defending:72,physical:76}),
    p("Couhaib Driouech","LW",0,{pace:84,shooting:72,passing:71,dribbling:78,defending:34,physical:60}),
    p("Hirving Lozano","RW",0,{pace:86,shooting:78,passing:76,dribbling:81,defending:43,physical:66}),
  ]},
  { id:"BET", name:"Real Betis", country:"ESP", color:"#00954C", players:[
    p("Abde Ezzalzouli","LW",0,{pace:88,shooting:74,passing:72,dribbling:83,defending:34,physical:63}),
    p("Antony","RW",0,{pace:82,shooting:78,passing:77,dribbling:85,defending:45,physical:60}),
    p("Pablo García","LW",0,{pace:79,shooting:68,passing:67,dribbling:75,defending:32,physical:55}),
  ]},
  { id:"RMA", name:"Real Madrid", country:"ESP", color:"#FEBE10", players:[
    p("Vinícius Júnior","LW",0,{pace:95,shooting:86,passing:83,dribbling:92,defending:32,physical:73}),
    p("Rodrygo","RW",0,{pace:88,shooting:85,passing:83,dribbling:89,defending:34,physical:67}),
    p("Kylian Mbappé","LW",0,{pace:97,shooting:91,passing:83,dribbling:93,defending:39,physical:81}),
  ]},
  { id:"ROM", name:"Roma", country:"ITA", color:"#8E1F2F", players:[
    p("Matías Soulé","RW",0,{pace:79,shooting:78,passing:80,dribbling:85,defending:42,physical:59}),
    p("Stephan El Shaarawy","LW",0,{pace:81,shooting:78,passing:77,dribbling:82,defending:54,physical:65}),
    p("Paulo Dybala","RW",0,{pace:79,shooting:86,passing:86,dribbling:90,defending:40,physical:62}),
  ]},
  { id:"SHA", name:"Shakhtar", country:"UKR", color:"#F57F20", players:[
    p("Kevin","LW",0,{pace:86,shooting:73,passing:72,dribbling:80,defending:33,physical:58}),
    p("Eguinaldo","LW",0,{pace:84,shooting:72,passing:66,dribbling:76,defending:30,physical:69}),
    p("Pedrinho","RW",0,{pace:82,shooting:70,passing:72,dribbling:78,defending:34,physical:56}),
  ]},
  { id:"SLP", name:"Slavia Praha", country:"CZE", color:"#D71920", players:[
    p("Lukáš Provod","LM",0,{pace:75,shooting:76,passing:80,dribbling:78,defending:64,physical:76}),
    p("Simion Michez","RW",0,{pace:83,shooting:69,passing:68,dribbling:76,defending:32,physical:58}),
    p("Ivan Schranz","RW",0,{pace:75,shooting:74,passing:72,dribbling:74,defending:48,physical:72}),
  ]},
  { id:"SPO", name:"Sporting CP", country:"POR", color:"#006600", players:[
    p("Francisco Trincão","RW",0,{pace:82,shooting:80,passing:81,dribbling:86,defending:39,physical:61}),
    p("Pedro Gonçalves","LW",0,{pace:78,shooting:84,passing:84,dribbling:85,defending:57,physical:69}),
    p("Geovany Quenda","RW",0,{pace:86,shooting:71,passing:73,dribbling:81,defending:52,physical:58}),
  ]},
  { id:"STU", name:"Stuttgart", country:"GER", color:"#E32221", players:[
    p("Chris Führich","LW",0,{pace:82,shooting:79,passing:82,dribbling:85,defending:43,physical:62}),
    p("Jamie Leweling","RW",0,{pace:84,shooting:76,passing:76,dribbling:81,defending:50,physical:72}),
    p("Silas","RW",0,{pace:89,shooting:74,passing:68,dribbling:79,defending:35,physical:74}),
  ]},
  { id:"VIL", name:"Villarreal", country:"ESP", color:"#FFD700", players:[
    p("Yeremy Pino","RW",0,{pace:81,shooting:78,passing:79,dribbling:84,defending:53,physical:65}),
    p("Nicolas Pépé","RW",0,{pace:83,shooting:78,passing:74,dribbling:80,defending:35,physical:66}),
    p("Ilias Akhomach","RW",0,{pace:82,shooting:70,passing:70,dribbling:78,defending:34,physical:57}),
  ]},
  { id:"AEK", name:"AEK Athens", country:"GRE", color:"#F5C400", players:[
    p("Niclas Eliasson","RW",0,{pace:78,shooting:72,passing:77,dribbling:78,defending:45,physical:60}),
    p("Anthony Martial","LW",0,{pace:79,shooting:80,passing:74,dribbling:80,defending:34,physical:67}),
    p("Levi García","LW",0,{pace:87,shooting:76,passing:69,dribbling:77,defending:34,physical:80}),
  ]},
  { id:"CEL", name:"Celtic", country:"SCO", color:"#16A950", players:[
    p("Daizen Maeda","LW",0,{pace:90,shooting:75,passing:70,dribbling:79,defending:51,physical:73}),
    p("Nicolas Kühn","RW",0,{pace:83,shooting:74,passing:73,dribbling:79,defending:38,physical:61}),
    p("Yang Hyun-Jun","RW",0,{pace:81,shooting:67,passing:66,dribbling:74,defending:37,physical:60}),
  ]},
  { id:"LAS", name:"LASK", country:"AUT", color:"#111111", players:[
    p("Moses Usor","LW",0,{pace:84,shooting:69,passing:67,dribbling:74,defending:37,physical:66}),
    p("Valon Berisha","LM",0,{pace:71,shooting:73,passing:77,dribbling:76,defending:58,physical:68}),
    p("Florian Flecker","RM",0,{pace:76,shooting:70,passing:71,dribbling:72,defending:55,physical:70}),
  ]},
  { id:"VIK", name:"Viking", country:"NOR", color:"#0033A0", players:[
    p("Zlatko Tripić","LW",0,{pace:72,shooting:73,passing:75,dribbling:74,defending:45,physical:68}),
    p("Sander Svendsen","RW",0,{pace:80,shooting:69,passing:67,dribbling:73,defending:32,physical:58}),
    p("Herman Haugen","RM",0,{pace:78,shooting:65,passing:67,dribbling:70,defending:57,physical:68}),
  ]},
  { id:"BDG", name:"Bodø/Glimt", country:"NOR", color:"#FFD500", players:[
    p("Jens Petter Hauge","LW",0,{pace:81,shooting:73,passing:73,dribbling:78,defending:39,physical:64}),
    p("Sondre Sørli","RW",0,{pace:75,shooting:68,passing:69,dribbling:72,defending:47,physical:64}),
    p("Nino Žugelj","RW",0,{pace:78,shooting:68,passing:66,dribbling:73,defending:36,physical:65}),
  ]},
  { id:"LYN", name:"Lyon", country:"FRA", color:"#0032A0", players:[
    p("Malick Fofana","LW",0,{pace:88,shooting:75,passing:73,dribbling:83,defending:34,physical:61}),
    p("Ernest Nuamah","RW",0,{pace:88,shooting:73,passing:71,dribbling:81,defending:31,physical:60}),
    p("Rayan Cherki","RW",0,{pace:76,shooting:80,passing:83,dribbling:88,defending:34,physical:58}),
  ]},
  { id:"OLY", name:"Olympiacos", country:"GRE", color:"#CC0000", players:[
    p("Daniel Podence","LW",0,{pace:84,shooting:76,passing:77,dribbling:83,defending:38,physical:58}),
    p("Giorgos Masouras","RW",0,{pace:78,shooting:75,passing:72,dribbling:75,defending:48,physical:72}),
    p("Gelson Martins","RW",0,{pace:88,shooting:71,passing:72,dribbling:81,defending:35,physical:58}),
  ]},
];
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function avgClubPower(c) { return Math.round(c.players.reduce((s,p)=>s+p.overall,0)/c.players.length); }
function overall(attrs) {
  const vals = Object.values(attrs);
  if (!vals.length) return 0;
  const weights = { dribbling: 0.28, pace: 0.22, passing: 0.21, shooting: 0.17, physical: 0.08, defending: 0.04 };
  let total = 0, w = 0;
  for (const [k,v] of Object.entries(attrs)) { total += v * (weights[k] || 0.1); w += (weights[k] || 0.1); }
  return Math.round(total / w);
}
function grade(n) {
  if (n >= 90) return ["WORLD CLASS", "#f6d05f"];
  if (n >= 85) return ["ELITE", "#e9e5d8"];
  if (n >= 80) return ["EXCELLENT", "#b8925a"];
  if (n >= 75) return ["VERY GOOD", "#b6ff4c"];
  if (n >= 70) return ["GOOD", "#6da8ff"];
  return ["DECENT", "#9E9E9E"];
}
function crest(club) { return club?.id || "UCL"; }
function simScore(userPower, oppPower, home) {
  const adv = Math.floor((userPower - oppPower) / 8) + (home ? 1 : 0);
  const ug = Math.max(0, randInt(0,3) + Math.max(0, adv));
  const og = Math.max(0, randInt(0,3) + Math.max(0, -adv));
  return { ug, og };
}
function makeGoals(home, away, hg, ag) {
  const mins = shuffle([7,12,18,26,31,37,42,52,59,63,71,78,84,90]);
  const goals = [];
  for (let i=0; i<hg; i++) goals.push({ minute: mins.pop(), club: home });
  for (let i=0; i<ag; i++) goals.push({ minute: mins.pop(), club: away });
  return goals.sort((a,b) => a.minute - b.minute);
}
function pointsFor(gf, ga) { return gf > ga ? 3 : gf === ga ? 1 : 0; }
function buildLeagueRows(seasonClub, matches) {
  const user = { ...seasonClub, w:0,d:0,l:0,gf:0,ga:0,pts:0 };
  matches.forEach(m => {
    const gf = m.home.id === seasonClub.id ? m.hg : m.ag;
    const ga = m.home.id === seasonClub.id ? m.ag : m.hg;
    user.gf += gf; user.ga += ga; user.pts += pointsFor(gf, ga);
    if (gf > ga) user.w++; else if (gf === ga) user.d++; else user.l++;
  });
  const others = CLUBS.filter(c => c.id !== seasonClub.id).map(c => {
    const power = avgClubPower(c);
    let w=0,d=0,l=0,gf=0,ga=0,pts=0;
    for(let i=0;i<8;i++) {
      const oppPower = randInt(72,88);
      const f = Math.max(0, randInt(0,3) + Math.floor((power-78)/7));
      const a = Math.max(0, randInt(0,3) + Math.floor((oppPower-power)/11));
      gf += f; ga += a; pts += pointsFor(f,a);
      if(f>a) w++; else if(f===a) d++; else l++;
    }
    return {...c,w,d,l,gf,ga,pts};
  });
  return [user, ...others]
    .sort((a,b) => b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf)
    .map((t,i) => ({...t, pos:i+1}));
}

function Spinner({ items, active, onDone, label, locked, displayText }) {
  const [display, setDisplay] = useState(items[0] || "—");
  const interval = useRef(null);
  useEffect(() => {
    if (!active || !items.length) return;
    let count = 0;
    const total = 24 + randInt(0, 16);
    interval.current = setInterval(() => {
      setDisplay(pick(items));
      count++;
      if (count >= total) {
        clearInterval(interval.current);
        const result = pick(items);
        setDisplay(result);
        onDone(result);
      }
    }, 55);
    return () => clearInterval(interval.current);
  }, [active]);
  return <div className={`spinner ${active ? "active" : ""} ${locked ? "locked" : ""}`}>
    <div className="mini-label">{label}</div>
    <div className="spin-text">{locked ? displayText : display}</div>
  </div>;
}

function StatCard({ player, used, onTake }) {
  return <div className="stat-grid">
    {ATTRS.map(a => {
      const taken = used[a.id] !== undefined;
      return <button key={a.id} disabled={taken} className={`stat-choice ${taken ? "taken" : ""}`} onClick={() => onTake(a.id)}>
        <div><div className="stat-name">{a.icon} {a.label}</div><div className="stat-desc">{taken ? "Already chosen" : a.desc}</div></div>
        <div className="stat-num">{taken ? used[a.id] : player.stats[a.id]}</div>
      </button>
    })}
  </div>
}

function WingerCard({ attrs, club }) {
  const ovr = overall(attrs);
  const [name, color] = grade(ovr);
  return <div className="final-card">
    <div className="card-top">
      <div><div className="mini-label">YOUR WINGER</div><h2>{club?.name || "No club yet"}</h2><p>{club?.country || "Spin after draft"}</p></div>
      <div className="ovr" style={{color}}>{ovr || "—"}<span>{name}</span></div>
    </div>
    {ATTRS.map(a => <div key={a.id} className="bar-row"><span>{a.icon} {a.label}</span><b>{attrs[a.id] ?? "—"}</b><div className="bar"><div style={{width:`${attrs[a.id] || 0}%`}} /></div></div>)}
  </div>
}
function Btn({ children, onClick, disabled, ghost }) { return <button className={`btn ${ghost ? "ghost" : ""}`} disabled={disabled} onClick={onClick}>{children}</button> }

function MatchCard({ match, live=false }) {
  if (!match) return null;
  return <div className="match-card">
    <div className="round-line"><span>{match.label}</span>{live && <b>● LIVE</b>}</div>
    <div className="scoreline">
      <div className="team-box"><div className="crest" style={{borderColor: match.home.color}}>{crest(match.home)}</div><strong>{match.home.name}</strong></div>
      <div className="big-score">{match.hg} : {match.ag}</div>
      <div className="team-box"><div className="crest" style={{borderColor: match.away.color}}>{crest(match.away)}</div><strong>{match.away.name}</strong></div>
    </div>
    <div className="goals"><div className="mini-label">GOALS</div>{match.goals.length ? match.goals.map((g,i)=><div key={i}><span>{g.minute}'</span><b>⚽</b> {g.club.name}</div>) : <p className="muted">No goals.</p>}</div>
  </div>
}

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [phase, setPhase] = useState("idle");
  const [draftClub, setDraftClub] = useState(null);
  const [player, setPlayer] = useState(null);
  const [attrs, setAttrs] = useState({});
  const [history, setHistory] = useState([]);
  const [seasonClub, setSeasonClub] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchIdx, setMatchIdx] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [rows, setRows] = useState([]);
  const [koStage, setKoStage] = useState("r16");
  const [koResult, setKoResult] = useState(null);
  const [duel, setDuel] = useState(null);

  const done = Object.keys(attrs).length >= ATTRS.length;
  const playerNames = useMemo(() => draftClub ? draftClub.players.map(p => p.name) : [], [draftClub]);
  const draftSpinNames = CLUBS.map(c => c.name);

  function reset() {
    setScreen("draft"); setPhase("idle"); setDraftClub(null); setPlayer(null); setAttrs({}); setHistory([]);
    setSeasonClub(null); setFixtures([]); setMatches([]); setMatchIdx(0); setCurrentMatch(null); setRows([]); setKoResult(null); setDuel(null);
  }
  function spinClub() { setDraftClub(null); setPlayer(null); setPhase("club"); }
  function onClubDone(name) { const c = CLUBS.find(x => x.name === name); setDraftClub(c); setPhase("player"); }
  function onPlayerDone(name) { const pl = draftClub.players.find(x => x.name === name); setPlayer(pl); setPhase("choose"); }
  function takeStat(id) {
    if (!player || attrs[id] !== undefined) return;
    const stat = ATTRS.find(a => a.id === id);
    setAttrs(prev => ({...prev, [id]: player.stats[id]}));
    setHistory(h => [...h, { club: draftClub.name, player: player.name, position: player.position, stat: stat.label, value: player.stats[id] }]);
    setPlayer(null); setDraftClub(null); setPhase("idle");
  }
  function goClubReveal() { setScreen("club_reveal"); setPhase("season_idle"); setSeasonClub(null); }
  function spinSeasonClub() { setSeasonClub(null); setPhase("season_spin"); }
  function onSeasonClubDone(name) { const c = CLUBS.find(x => x.name === name); setSeasonClub(c); setPhase("season_done"); }
  function startLeaguePhase() {
    const opponents = shuffle(CLUBS.filter(c => c.id !== seasonClub.id)).slice(0,8);
    const fix = opponents.map((opp,i) => Math.random() > 0.5
      ? { label:`MATCHDAY ${i+1}`, home: seasonClub, away: opp }
      : { label:`MATCHDAY ${i+1}`, home: opp, away: seasonClub });
    setFixtures(fix); setMatches([]); setMatchIdx(0); setCurrentMatch(null); setScreen("league_match");
  }
  function playNextLeagueMatch() {
    const base = fixtures[matchIdx];
    const userHome = base.home.id === seasonClub.id;
    const opp = userHome ? base.away : base.home;
    const score = simScore(overall(attrs), avgClubPower(opp), userHome);
    const hg = userHome ? score.ug : score.og;
    const ag = userHome ? score.og : score.ug;
    const match = {...base, hg, ag, goals: makeGoals(base.home, base.away, hg, ag)};
    setCurrentMatch(match); setMatches(ms => [...ms, match]);
  }
  function nextAfterMatch() {
    const next = matchIdx + 1;
    if (next >= fixtures.length) {
      const finalMatches = [...matches, currentMatch].filter(Boolean);
      const r = buildLeagueRows(seasonClub, finalMatches);
      setRows(r);
      const pos = r.find(x => x.id === seasonClub.id)?.pos || 30;
      if (pos <= 8) setKoStage("r16"); else if (pos <= 24) setKoStage("playoffs"); else setKoStage("out");
      setScreen("league_table");
    } else { setMatchIdx(next); setCurrentMatch(null); }
  }
  function playKO() {
    const labels = {playoffs:"KNOCKOUT PLAY-OFF", r16:"ROUND OF 16", qf:"QUARTER-FINAL", sf:"SEMI-FINAL", f:"FINAL"};
    const next = {playoffs:"r16", r16:"qf", qf:"sf", sf:"f", f:"win"};
    const opp = pick(CLUBS.filter(c => c.id !== seasonClub?.id));
    const userHome = true;
    const score = simScore(overall(attrs), avgClubPower(opp), userHome);
    let hg = score.ug, ag = score.og;
    if (Math.random() < 0.26) { const tied = Math.max(hg,ag); hg = tied; ag = tied; }
    const match = { label: labels[koStage], home: seasonClub, away: opp, hg, ag, goals: makeGoals(seasonClub, opp, hg, ag), final: koStage === "f" };
    if (hg === ag) {
      setDuel({ match, nextStage: next[koStage], keeper: pick(["left","middle","right"]), result: null });
      setScreen("one_v_one");
    } else {
      const won = hg > ag;
      setKoResult({ match, won, nextStage: next[koStage] });
      setKoStage(won ? next[koStage] : "lost");
      setScreen("ko_result");
    }
  }
  function shootOneVOne(choice) {
    if (!duel || duel.result) return;
    const quality = overall(attrs);
    const keeper = duel.keeper;
    const beatsKeeper = choice !== keeper;
    const clinical = Math.random() < Math.min(0.92, Math.max(0.58, quality / 105));
    const scored = beatsKeeper && clinical;
    setDuel(d => ({...d, choice, result: scored ? "scored" : "saved"}));
  }
  function continueDuel() {
    const won = duel.result === "scored";
    setKoResult({ match: duel.match, won, onevone: true, choice: duel.choice, keeper: duel.keeper, nextStage: duel.nextStage });
    setKoStage(won ? duel.nextStage : "lost");
    setScreen("ko_result");
  }

  const note = <div className="sources">Offline version: current UEFA club list + editable FUT.GG-style base cards. Visible stats are recalculated from underlying attributes using the winger formulas in the code.</div>;

  if (screen === "intro") return <main><section className="hero"><div className="eyebrow">UEFA CHAMPIONS LEAGUE</div><h1>BUILD-A-<br/>WINGER</h1><p>Spin clubs and players for your stats. After your card is finished, spin the club you play for and play all eight league-phase matches.</p><div className="steps"><div>1<br/><b>Draft stats</b></div><div>2<br/><b>Spin your club</b></div><div>3<br/><b>Play 8 games</b></div><div>4<br/><b>One-v-one drama</b></div></div><Btn onClick={reset}>Enter Draft</Btn>{note}</section></main>;

  if (screen === "draft") return <main><section className="wrap"><header className="topline"><div><div className="eyebrow">DRAFT {Object.keys(attrs).length}/{ATTRS.length}</div><h2>{done ? "Your winger is complete" : "Spin a player, then choose any open stat"}</h2><p className="muted">Every club has an equal chance on every club spin. A club can come back again, like a real wheel.</p></div><div className="pill">OVR {overall(attrs) || "—"}</div></header><div className="progress">{ATTRS.map(a => <div key={a.id} className={attrs[a.id] ? "on" : ""} />)}</div>{!done && <div className="panel"><div className="section-title">STEP 1 — CLUB SPIN</div><Spinner items={draftSpinNames} active={phase === "club"} onDone={onClubDone} label="CLUB" locked={!!draftClub} displayText={draftClub?.name}/>{draftClub && <div className="club-info"><span style={{background:draftClub.color}}/> SELECTED CLUB: <b>{draftClub.name}</b> · {draftClub.country}</div>}<Btn onClick={spinClub} disabled={phase === "club" || phase === "player"}>{draftClub ? "Re-spin Club" : "Spin Club"}</Btn></div>}{!done && draftClub && <div className="panel"><div className="section-title">STEP 2 — PLAYER SPIN</div><Spinner items={playerNames} active={phase === "player"} onDone={onPlayerDone} label={`${draftClub.name} WINGER`} locked={!!player} displayText={player?.name}/>{player && <div className="player-card"><div><div className="eyebrow">{draftClub.name} WINGER</div><h3>{player.name}</h3><p>{player.position} · {player.overall} OVR</p></div><b>{player.overall}</b></div>}{phase === "choose" && <Btn onClick={() => setPhase("player")}>Re-spin Player</Btn>}</div>}{!done && player && phase === "choose" && <div className="panel"><div className="section-title">STEP 3 — CHOOSE ONE STAT TO TAKE</div><StatCard player={player} used={attrs} onTake={takeStat}/></div>}<div className="grid-two"><WingerCard attrs={attrs} club={seasonClub}/><div className="panel"><div className="section-title">PICKS SO FAR</div>{history.length === 0 ? <p className="muted">No stats taken yet.</p> : history.map((h,i)=><div className="pick-row" key={i}><span>{h.player}<small>{h.club} · {h.position}</small></span><b>{h.stat} {h.value}</b></div>)}{done && <><Btn onClick={goClubReveal}>Find out who you play for</Btn><Btn ghost onClick={reset}>Redraft</Btn></>}</div></div>{note}</section></main>;

  if (screen === "club_reveal") return <main><section className="club-reveal"><header><h1>WHO DO YOU PLAY FOR?</h1><p>The wheel decides your club for the season.</p></header><div className="wheel-box"><Spinner items={CLUBS.map(c=>c.name)} active={phase === "season_spin"} onDone={onSeasonClubDone} label="YOUR CLUB" locked={!!seasonClub} displayText={seasonClub?.name}/>{seasonClub && <div className="chosen"><div className="crest big" style={{borderColor: seasonClub.color}}>{seasonClub.id}</div><h2>{seasonClub.name}</h2><p>{seasonClub.country}</p></div>}</div>{!seasonClub ? <Btn onClick={spinSeasonClub} disabled={phase === "season_spin"}>Spin My Club</Btn> : <Btn onClick={startLeaguePhase}>Start League Phase</Btn>}</section></main>;

  if (screen === "league_match") {
    const upcoming = fixtures[matchIdx];
    return <main><section className="cup-run"><header className="cup-head"><div><div className="eyebrow">UEFA CHAMPIONS LEAGUE</div><h1>LEAGUE PHASE RUN</h1></div><div className="dots">{fixtures.map((_,i)=><span key={i} className={i <= matchIdx ? "on" : ""}/>)}</div></header>{currentMatch ? <><MatchCard match={currentMatch} live/><Btn onClick={nextAfterMatch}>{matchIdx + 1 >= fixtures.length ? "View League Table" : "Next Matchday"}</Btn></> : <><div className="next-fixture"><div className="mini-label">{upcoming?.label}</div><div className="versus"><div><div className="crest" style={{borderColor: upcoming.home.color}}>{upcoming.home.id}</div><b>{upcoming.home.name}</b></div><strong>VS</strong><div><div className="crest" style={{borderColor: upcoming.away.color}}>{upcoming.away.id}</div><b>{upcoming.away.name}</b></div></div></div><Btn onClick={playNextLeagueMatch}>Play {upcoming?.label}</Btn></>}</section></main>;
  }

  if (screen === "league_table") {
    const pos = rows.find(r => r.id === seasonClub?.id)?.pos || 30;
    const msg = pos <= 8 ? "Round of 16 — Seeded" : pos <= 24 ? "Knockout play-offs" : "Eliminated";
    return <main><section className="wrap"><header className="topline"><div><div className="eyebrow">FINAL LEAGUE TABLE</div><h2>{seasonClub?.name} finished #{pos}</h2><p className="muted">{msg}</p></div><div className="pill">#{pos}</div></header><div className="table">{rows.map(r => <div key={r.id} className={r.id === seasonClub?.id ? "me" : ""}><span>{r.pos}</span><b>{r.name}</b><em>{r.w}-{r.d}-{r.l}</em><i>{r.gf-r.ga >= 0 ? "+" : ""}{r.gf-r.ga}</i><strong>{r.pts}</strong></div>)}</div>{koStage !== "out" ? <Btn onClick={() => setScreen("ko_intro")}>Continue to Knockouts</Btn> : <Btn onClick={reset}>Try Again</Btn>}</section></main>
  }
  if (screen === "ko_intro") return <main><section className="wrap"><header className="topline"><div><div className="eyebrow">KNOCKOUTS</div><h2>{koStage === "playoffs" ? "Knockout Play-offs" : koStage === "r16" ? "Round of 16" : koStage === "qf" ? "Quarter-Final" : koStage === "sf" ? "Semi-Final" : "Final"}</h2><p className="muted">If the match is tied, your winger gets a one-on-one with the keeper.</p></div><div className="pill">OVR {overall(attrs)}</div></header><WingerCard attrs={attrs} club={seasonClub}/><Btn onClick={playKO}>Play Match</Btn></section></main>;

  if (screen === "one_v_one") return <main><section className="duel"><header><div className="eyebrow">SUDDEN DEATH · ONE ON ONE</div><h1>BEAT THE KEEPER</h1><p>Pick your finish — score to go through.</p></header><div className="pitch"><div className={`keeper ${duel?.result ? duel.keeper : "middle"}`}>🧤</div><div className="goal-net"/><div className="attacker">⚽</div>{duel?.result && <div className={`duel-result ${duel.result}`}>{duel.result === "scored" ? "GOAL!" : "SAVED!"}</div>}</div>{!duel?.result ? <div className="choice-row"><button onClick={()=>shootOneVOne("left")}>◀ LEFT</button><button onClick={()=>shootOneVOne("middle")}>▲ MIDDLE</button><button onClick={()=>shootOneVOne("right")}>RIGHT ▶</button></div> : <Btn onClick={continueDuel}>Continue</Btn>}</section></main>;

  if (screen === "ko_result") {
    if (koStage === "win") return <main><section className="hero"><h1>🏆 CHAMPIONS</h1><p>You won the Champions League with a {overall(attrs)} rated winger.</p><Btn onClick={reset}>Draft Again</Btn></section></main>;
    if (koStage === "lost") return <main><section className="hero"><h1>💔 ELIMINATED</h1><p>{koResult?.match?.away?.name} knocked you out.</p><MatchCard match={koResult?.match}/>{koResult?.onevone && <p className="muted">One-on-one: you chose {koResult.choice}; keeper went {koResult.keeper}.</p>}<Btn onClick={reset}>Try Again</Btn></section></main>;
    return <main><section className="wrap"><header className="topline"><div><div className="eyebrow">{koResult?.match?.label}</div><h2>Advanced!</h2></div></header><MatchCard match={koResult?.match}/>{koResult?.onevone && <p className="muted">Won on a one-on-one finish.</p>}<Btn onClick={() => setScreen("ko_intro")}>Play Next Round</Btn></section></main>;
  }
}
