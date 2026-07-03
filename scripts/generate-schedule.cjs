#!/usr/bin/env node
/**
 * generate-schedule.js
 * Rebuilds the entire World Cup 2026 schedule:
 *  1. Patches TEAMS, MATCHES, and resolveKnockout() in site/index.html
 *  2. Regenerates all 48 individual team pages under site/<slug>/index.html
 *  3. Removes team directories that are no longer in the tournament
 *
 * Reads site/assets/manifest.json (written by fingerprint.cjs) to inject
 * content-hashed CSS URLs into generated HTML.
 */

const fs   = require('fs');
const path = require('path');

// Load the asset manifest produced by fingerprint.cjs so we can reference
// fingerprinted filenames in generated HTML.
const MANIFEST_PATH = path.join(__dirname, '..', 'site', 'assets', 'manifest.json');
let assetManifest = {};
if (fs.existsSync(MANIFEST_PATH)) {
  try {
    assetManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (e) {
    console.warn('[generate] Could not parse assets/manifest.json — CSS will use unfingerprinted URL:', e.message);
  }
} else {
  console.warn('[generate] assets/manifest.json not found — run fingerprint.cjs first for cache-busting hashes');
}

// Resolve a source asset path to its fingerprinted version, falling back to
// the original path if the manifest doesn't have an entry.
function assetUrl(srcPath) {
  return assetManifest[srcPath] || srcPath;
}

// ─── TEAMS ────────────────────────────────────────────────────────────────────
const TEAMS = [
  { name:"Mexico",         flag:"🇲🇽", group:"A", slug:"mexico" },
  { name:"South Africa",   flag:"🇿🇦", group:"A", slug:"south-africa" },
  { name:"South Korea",    flag:"🇰🇷", group:"A", slug:"south-korea" },
  { name:"Czechia",        flag:"🇨🇿", group:"A", slug:"czechia" },

  { name:"Canada",         flag:"🇨🇦", group:"B", slug:"canada" },
  { name:"Bosnia & Herz.", flag:"🇧🇦", group:"B", slug:"bosnia" },
  { name:"Qatar",          flag:"🇶🇦", group:"B", slug:"qatar" },
  { name:"Switzerland",    flag:"🇨🇭", group:"B", slug:"switzerland" },

  { name:"Brazil",         flag:"🇧🇷", group:"C", slug:"brazil" },
  { name:"Morocco",        flag:"🇲🇦", group:"C", slug:"morocco" },
  { name:"Haiti",          flag:"🇭🇹", group:"C", slug:"haiti" },
  { name:"Scotland",       flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", group:"C", slug:"scotland" },

  { name:"USA",            flag:"🇺🇸", group:"D", slug:"usa" },
  { name:"Paraguay",       flag:"🇵🇾", group:"D", slug:"paraguay" },
  { name:"Australia",      flag:"🇦🇺", group:"D", slug:"australia" },
  { name:"Türkiye",        flag:"🇹🇷", group:"D", slug:"turkiye" },

  { name:"Germany",        flag:"🇩🇪", group:"E", slug:"germany" },
  { name:"Curaçao",        flag:"🇨🇼", group:"E", slug:"curacao" },
  { name:"Côte d'Ivoire",  flag:"🇨🇮", group:"E", slug:"cote-divoire" },
  { name:"Ecuador",        flag:"🇪🇨", group:"E", slug:"ecuador" },

  { name:"Netherlands",    flag:"🇳🇱", group:"F", slug:"netherlands" },
  { name:"Japan",          flag:"🇯🇵", group:"F", slug:"japan" },
  { name:"Sweden",         flag:"🇸🇪", group:"F", slug:"sweden" },
  { name:"Tunisia",        flag:"🇹🇳", group:"F", slug:"tunisia" },

  { name:"Belgium",        flag:"🇧🇪", group:"G", slug:"belgium" },
  { name:"Egypt",          flag:"🇪🇬", group:"G", slug:"egypt" },
  { name:"Iran",           flag:"🇮🇷", group:"G", slug:"iran" },
  { name:"New Zealand",    flag:"🇳🇿", group:"G", slug:"new-zealand" },

  { name:"Spain",          flag:"🇪🇸", group:"H", slug:"spain" },
  { name:"Cape Verde",     flag:"🇨🇻", group:"H", slug:"cape-verde" },
  { name:"Saudi Arabia",   flag:"🇸🇦", group:"H", slug:"saudi-arabia" },
  { name:"Uruguay",        flag:"🇺🇾", group:"H", slug:"uruguay" },

  { name:"France",         flag:"🇫🇷", group:"I", slug:"france" },
  { name:"Senegal",        flag:"🇸🇳", group:"I", slug:"senegal" },
  { name:"Iraq",           flag:"🇮🇶", group:"I", slug:"iraq" },
  { name:"Norway",         flag:"🇳🇴", group:"I", slug:"norway" },

  { name:"Argentina",      flag:"🇦🇷", group:"J", slug:"argentina" },
  { name:"Algeria",        flag:"🇩🇿", group:"J", slug:"algeria" },
  { name:"Austria",        flag:"🇦🇹", group:"J", slug:"austria" },
  { name:"Jordan",         flag:"🇯🇴", group:"J", slug:"jordan" },

  { name:"Portugal",       flag:"🇵🇹", group:"K", slug:"portugal" },
  { name:"DR Congo",       flag:"🇨🇩", group:"K", slug:"dr-congo" },
  { name:"Uzbekistan",     flag:"🇺🇿", group:"K", slug:"uzbekistan" },
  { name:"Colombia",       flag:"🇨🇴", group:"K", slug:"colombia" },

  { name:"England",        flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", group:"L", slug:"england" },
  { name:"Croatia",        flag:"🇭🇷", group:"L", slug:"croatia" },
  { name:"Ghana",          flag:"🇬🇭", group:"L", slug:"ghana" },
  { name:"Panama",         flag:"🇵🇦", group:"L", slug:"panama" },
];

// ─── MATCHES ──────────────────────────────────────────────────────────────────
const MATCHES = [
  // GROUP A: Mexico, South Africa, South Korea, Czechia
  {id:1,  stage:"Group Stage", group:"A", home:"Mexico",        away:"South Africa",  utc:"2026-06-11T19:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:2,  stage:"Group Stage", group:"A", home:"South Korea",   away:"Czechia",       utc:"2026-06-12T02:00:00Z", venue:"Estadio Akron",           city:"Guadalajara, MEX"},
  {id:25, stage:"Group Stage", group:"A", home:"Czechia",       away:"South Africa",  utc:"2026-06-18T16:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:28, stage:"Group Stage", group:"A", home:"Mexico",        away:"South Korea",   utc:"2026-06-19T01:00:00Z", venue:"Estadio Akron",           city:"Guadalajara, MEX"},
  {id:53, stage:"Group Stage", group:"A", home:"Czechia",       away:"Mexico",        utc:"2026-06-25T01:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:54, stage:"Group Stage", group:"A", home:"South Africa",  away:"South Korea",   utc:"2026-06-25T01:00:00Z", venue:"Estadio BBVA",            city:"Monterrey, MEX"},

  // GROUP B: Canada, Bosnia & Herz., Qatar, Switzerland
  {id:3,  stage:"Group Stage", group:"B", home:"Canada",        away:"Bosnia & Herz.", utc:"2026-06-12T19:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:8,  stage:"Group Stage", group:"B", home:"Qatar",         away:"Switzerland",    utc:"2026-06-13T19:00:00Z", venue:"Levi's Stadium",          city:"San Jose, USA"},
  {id:26, stage:"Group Stage", group:"B", home:"Switzerland",   away:"Bosnia & Herz.", utc:"2026-06-18T19:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:27, stage:"Group Stage", group:"B", home:"Canada",        away:"Qatar",          utc:"2026-06-18T22:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:51, stage:"Group Stage", group:"B", home:"Switzerland",   away:"Canada",         utc:"2026-06-24T19:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:52, stage:"Group Stage", group:"B", home:"Bosnia & Herz.",away:"Qatar",          utc:"2026-06-24T19:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},

  // GROUP C: Brazil, Morocco, Haiti, Scotland
  {id:7,  stage:"Group Stage", group:"C", home:"Brazil",        away:"Morocco",       utc:"2026-06-13T22:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:5,  stage:"Group Stage", group:"C", home:"Haiti",         away:"Scotland",      utc:"2026-06-14T01:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:30, stage:"Group Stage", group:"C", home:"Scotland",      away:"Morocco",       utc:"2026-06-19T22:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:29, stage:"Group Stage", group:"C", home:"Brazil",        away:"Haiti",         utc:"2026-06-20T00:30:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:49, stage:"Group Stage", group:"C", home:"Scotland",      away:"Brazil",        utc:"2026-06-24T22:00:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},
  {id:50, stage:"Group Stage", group:"C", home:"Morocco",       away:"Haiti",         utc:"2026-06-24T22:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},

  // GROUP D: USA, Paraguay, Australia, Türkiye
  {id:4,  stage:"Group Stage", group:"D", home:"USA",           away:"Paraguay",      utc:"2026-06-13T01:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:6,  stage:"Group Stage", group:"D", home:"Australia",     away:"Türkiye",       utc:"2026-06-14T04:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:32, stage:"Group Stage", group:"D", home:"USA",           away:"Australia",     utc:"2026-06-19T19:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:31, stage:"Group Stage", group:"D", home:"Türkiye",       away:"Paraguay",      utc:"2026-06-20T03:00:00Z", venue:"Levi's Stadium",          city:"San Jose, USA"},
  {id:59, stage:"Group Stage", group:"D", home:"Türkiye",       away:"USA",           utc:"2026-06-26T02:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:60, stage:"Group Stage", group:"D", home:"Paraguay",      away:"Australia",     utc:"2026-06-26T02:00:00Z", venue:"Levi's Stadium",          city:"San Jose, USA"},

  // GROUP E: Germany, Curaçao, Côte d'Ivoire, Ecuador
  {id:10, stage:"Group Stage", group:"E", home:"Germany",       away:"Curaçao",       utc:"2026-06-14T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:9,  stage:"Group Stage", group:"E", home:"Côte d'Ivoire", away:"Ecuador",       utc:"2026-06-14T23:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:33, stage:"Group Stage", group:"E", home:"Germany",       away:"Côte d'Ivoire", utc:"2026-06-20T20:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:34, stage:"Group Stage", group:"E", home:"Ecuador",       away:"Curaçao",       utc:"2026-06-21T00:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:55, stage:"Group Stage", group:"E", home:"Curaçao",       away:"Côte d'Ivoire", utc:"2026-06-25T20:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:56, stage:"Group Stage", group:"E", home:"Ecuador",       away:"Germany",       utc:"2026-06-25T20:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},

  // GROUP F: Netherlands, Japan, Sweden, Tunisia
  {id:11, stage:"Group Stage", group:"F", home:"Netherlands",   away:"Japan",         utc:"2026-06-14T20:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:12, stage:"Group Stage", group:"F", home:"Sweden",        away:"Tunisia",       utc:"2026-06-15T02:00:00Z", venue:"Estadio BBVA",            city:"Monterrey, MEX"},
  {id:35, stage:"Group Stage", group:"F", home:"Netherlands",   away:"Sweden",        utc:"2026-06-20T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:36, stage:"Group Stage", group:"F", home:"Tunisia",       away:"Japan",         utc:"2026-06-21T04:00:00Z", venue:"Estadio BBVA",            city:"Monterrey, MEX"},
  {id:57, stage:"Group Stage", group:"F", home:"Japan",         away:"Sweden",        utc:"2026-06-25T23:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:58, stage:"Group Stage", group:"F", home:"Tunisia",       away:"Netherlands",   utc:"2026-06-25T23:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},

  // GROUP G: Belgium, Egypt, Iran, New Zealand
  {id:16, stage:"Group Stage", group:"G", home:"Belgium",       away:"Egypt",         utc:"2026-06-15T19:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:15, stage:"Group Stage", group:"G", home:"Iran",          away:"New Zealand",   utc:"2026-06-16T01:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:39, stage:"Group Stage", group:"G", home:"Belgium",       away:"Iran",          utc:"2026-06-21T19:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:40, stage:"Group Stage", group:"G", home:"New Zealand",   away:"Egypt",         utc:"2026-06-22T01:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:63, stage:"Group Stage", group:"G", home:"Egypt",         away:"Iran",          utc:"2026-06-27T03:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:64, stage:"Group Stage", group:"G", home:"New Zealand",   away:"Belgium",       utc:"2026-06-27T03:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},

  // GROUP H: Spain, Cape Verde, Saudi Arabia, Uruguay
  {id:14, stage:"Group Stage", group:"H", home:"Spain",         away:"Cape Verde",    utc:"2026-06-15T16:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:13, stage:"Group Stage", group:"H", home:"Saudi Arabia",  away:"Uruguay",       utc:"2026-06-15T22:00:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},
  {id:38, stage:"Group Stage", group:"H", home:"Spain",         away:"Saudi Arabia",  utc:"2026-06-21T16:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:37, stage:"Group Stage", group:"H", home:"Uruguay",       away:"Cape Verde",    utc:"2026-06-21T22:00:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},
  {id:65, stage:"Group Stage", group:"H", home:"Cape Verde",    away:"Saudi Arabia",  utc:"2026-06-27T00:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:66, stage:"Group Stage", group:"H", home:"Uruguay",       away:"Spain",         utc:"2026-06-27T00:00:00Z", venue:"Estadio Akron",           city:"Guadalajara, MEX"},

  // GROUP I: France, Senegal, Iraq, Norway
  {id:17, stage:"Group Stage", group:"I", home:"France",        away:"Senegal",       utc:"2026-06-16T19:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:18, stage:"Group Stage", group:"I", home:"Iraq",          away:"Norway",        utc:"2026-06-16T22:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:42, stage:"Group Stage", group:"I", home:"France",        away:"Iraq",          utc:"2026-06-22T21:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:41, stage:"Group Stage", group:"I", home:"Norway",        away:"Senegal",       utc:"2026-06-23T00:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:61, stage:"Group Stage", group:"I", home:"Norway",        away:"France",        utc:"2026-06-26T19:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:62, stage:"Group Stage", group:"I", home:"Senegal",       away:"Iraq",          utc:"2026-06-26T19:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},

  // GROUP J: Argentina, Algeria, Austria, Jordan
  {id:19, stage:"Group Stage", group:"J", home:"Argentina",     away:"Algeria",       utc:"2026-06-17T01:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:20, stage:"Group Stage", group:"J", home:"Austria",       away:"Jordan",        utc:"2026-06-17T04:00:00Z", venue:"Levi's Stadium",          city:"San Jose, USA"},
  {id:43, stage:"Group Stage", group:"J", home:"Argentina",     away:"Austria",       utc:"2026-06-22T17:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:44, stage:"Group Stage", group:"J", home:"Jordan",        away:"Algeria",       utc:"2026-06-23T03:00:00Z", venue:"Levi's Stadium",          city:"San Jose, USA"},
  {id:69, stage:"Group Stage", group:"J", home:"Algeria",       away:"Austria",       utc:"2026-06-28T02:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:70, stage:"Group Stage", group:"J", home:"Jordan",        away:"Argentina",     utc:"2026-06-28T02:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},

  // GROUP K: Portugal, DR Congo, Uzbekistan, Colombia
  {id:23, stage:"Group Stage", group:"K", home:"Portugal",      away:"DR Congo",      utc:"2026-06-17T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:24, stage:"Group Stage", group:"K", home:"Uzbekistan",    away:"Colombia",      utc:"2026-06-18T02:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:47, stage:"Group Stage", group:"K", home:"Portugal",      away:"Uzbekistan",    utc:"2026-06-23T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:48, stage:"Group Stage", group:"K", home:"Colombia",      away:"DR Congo",      utc:"2026-06-24T02:00:00Z", venue:"Estadio Akron",           city:"Guadalajara, MEX"},
  {id:71, stage:"Group Stage", group:"K", home:"Colombia",      away:"Portugal",      utc:"2026-06-27T23:30:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},
  {id:72, stage:"Group Stage", group:"K", home:"DR Congo",      away:"Uzbekistan",    utc:"2026-06-27T23:30:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},

  // GROUP L: England, Croatia, Ghana, Panama
  {id:22, stage:"Group Stage", group:"L", home:"England",       away:"Croatia",       utc:"2026-06-17T20:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:21, stage:"Group Stage", group:"L", home:"Ghana",         away:"Panama",        utc:"2026-06-17T23:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:45, stage:"Group Stage", group:"L", home:"England",       away:"Ghana",         utc:"2026-06-23T20:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:46, stage:"Group Stage", group:"L", home:"Panama",        away:"Croatia",       utc:"2026-06-23T23:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:67, stage:"Group Stage", group:"L", home:"Panama",        away:"England",       utc:"2026-06-27T21:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:68, stage:"Group Stage", group:"L", home:"Croatia",       away:"Ghana",         utc:"2026-06-27T21:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},

  // ROUND OF 32 (IDs 73–88; R32 Wn = winner of match 72+n) — June 28–July 3
  {id:73,  stage:"Round of 32", group:"—", home:"2A",      away:"2B",          utc:"2026-06-28T19:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:74,  stage:"Round of 32", group:"—", home:"1E",      away:"3A/B/C/D/F",  utc:"2026-06-29T20:30:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:75,  stage:"Round of 32", group:"—", home:"1F",      away:"2C",          utc:"2026-06-30T01:00:00Z", venue:"Estadio BBVA",            city:"Monterrey, MEX"},
  {id:76,  stage:"Round of 32", group:"—", home:"1C",      away:"2F",          utc:"2026-06-29T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:77,  stage:"Round of 32", group:"—", home:"1I",      away:"3C/D/F/G/H",  utc:"2026-06-30T21:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:78,  stage:"Round of 32", group:"—", home:"2E",      away:"2I",          utc:"2026-06-30T17:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:79,  stage:"Round of 32", group:"—", home:"1A",      away:"3C/E/F/H/I",  utc:"2026-07-01T01:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:80,  stage:"Round of 32", group:"—", home:"1L",      away:"3E/H/I/J/K",  utc:"2026-07-01T16:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:81,  stage:"Round of 32", group:"—", home:"1D",      away:"3B/E/F/I/J",  utc:"2026-07-02T00:00:00Z", venue:"Levi's Stadium",          city:"San Jose, USA"},
  {id:82,  stage:"Round of 32", group:"—", home:"1G",      away:"3A/E/H/I/J",  utc:"2026-07-01T20:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:83,  stage:"Round of 32", group:"—", home:"2K",      away:"2L",          utc:"2026-07-02T23:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:84,  stage:"Round of 32", group:"—", home:"1H",      away:"2J",          utc:"2026-07-02T19:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:85,  stage:"Round of 32", group:"—", home:"1B",      away:"3E/F/G/I/J",  utc:"2026-07-03T03:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:86,  stage:"Round of 32", group:"—", home:"1J",      away:"2H",          utc:"2026-07-03T22:00:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},
  {id:87,  stage:"Round of 32", group:"—", home:"1K",      away:"3D/E/I/J/L",  utc:"2026-07-04T01:30:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:88,  stage:"Round of 32", group:"—", home:"2D",      away:"2G",          utc:"2026-07-03T18:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},

  // ROUND OF 16 (IDs 89–96; R16 Wn = winner of match 88+n) — July 4–7
  {id:89,  stage:"Round of 16", group:"—", home:"R32 W2",  away:"R32 W5",  utc:"2026-07-04T21:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:90,  stage:"Round of 16", group:"—", home:"R32 W1",  away:"R32 W3",  utc:"2026-07-04T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:91,  stage:"Round of 16", group:"—", home:"R32 W4",  away:"R32 W6",  utc:"2026-07-05T20:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:92,  stage:"Round of 16", group:"—", home:"R32 W7",  away:"R32 W8",  utc:"2026-07-06T00:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:93,  stage:"Round of 16", group:"—", home:"R32 W11", away:"R32 W12", utc:"2026-07-06T19:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:94,  stage:"Round of 16", group:"—", home:"R32 W9",  away:"R32 W10", utc:"2026-07-07T00:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:95,  stage:"Round of 16", group:"—", home:"R32 W14", away:"R32 W16", utc:"2026-07-07T16:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:96,  stage:"Round of 16", group:"—", home:"R32 W13", away:"R32 W15", utc:"2026-07-07T20:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},

  // QUARTERFINALS (IDs 97–100; QF Wn = winner of match 96+n) — July 9–11
  {id:97,  stage:"Quarterfinal", group:"—", home:"R16 W1", away:"R16 W2", utc:"2026-07-09T20:00:00Z", venue:"Gillette Stadium",  city:"Boston, USA"},
  {id:98,  stage:"Quarterfinal", group:"—", home:"R16 W5", away:"R16 W6", utc:"2026-07-10T19:00:00Z", venue:"SoFi Stadium",      city:"Los Angeles, USA"},
  {id:99,  stage:"Quarterfinal", group:"—", home:"R16 W3", away:"R16 W4", utc:"2026-07-11T21:00:00Z", venue:"Hard Rock Stadium", city:"Miami, USA"},
  {id:100, stage:"Quarterfinal", group:"—", home:"R16 W7", away:"R16 W8", utc:"2026-07-12T01:00:00Z", venue:"Arrowhead Stadium", city:"Kansas City, USA"},

  // SEMIFINALS — July 14 (Dallas) and July 15 (Atlanta), confirmed per Wikipedia
  {id:101, stage:"Semifinal", group:"—", home:"QF W1", away:"QF W2", utc:"2026-07-14T19:00:00Z", venue:"AT&T Stadium",          city:"Dallas, USA"},
  {id:102, stage:"Semifinal", group:"—", home:"QF W3", away:"QF W4", utc:"2026-07-15T19:00:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, USA"},

  // 3RD PLACE + FINAL
  {id:103, stage:"Third Place Playoff", group:"—", home:"SF L1",  away:"SF L2",  utc:"2026-07-18T21:00:00Z", venue:"Hard Rock Stadium", city:"Miami, USA"},
  {id:104, stage:"Final", group:"—", home:"SF W1",  away:"SF W2",  utc:"2026-07-19T19:00:00Z", venue:"MetLife Stadium",   city:"New York, USA"},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getFlag(name) {
  const t = TEAMS.find(t => t.name === name);
  return t ? t.flag : '🏳️';
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;');
}

// Build "other teams" links HTML (all teams except the current one)
function otherTeamsHtml(currentSlug) {
  const sorted = [...TEAMS].sort((a,b) => a.name.localeCompare(b.name));
  return sorted
    .filter(t => t.slug !== currentSlug)
    .map(t => `<a href="/${t.slug}/" class="team-link">${t.flag} ${esc(t.name)}</a>`)
    .join('\n');
}

// Format a UTC ISO string to a readable display (for static page)
function fmtUtcLabel(utc) {
  const d = new Date(utc);
  const hh = String(d.getUTCHours()).padStart(2,'0');
  const mm = String(d.getUTCMinutes()).padStart(2,'0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${hh}:${mm} UTC`;
}

// ─── TEAM PAGE GENERATOR ──────────────────────────────────────────────────────
// Per-team editorial content lives in scripts/team-content/<slug>.html.
// The generator splices it in between the fixtures grid and the "other teams"
// block.  Teams without a content file get an empty string (no change).
function loadTeamContent(slug) {
  const contentPath = path.join(__dirname, 'team-content', `${slug}.html`);
  if (fs.existsSync(contentPath)) {
    return '\n' + fs.readFileSync(contentPath, 'utf8').trimEnd() + '\n';
  }
  return '';
}

function generateTeamPage(team, scores = {}) {
  const teamMatches = MATCHES.filter(m =>
    (m.stage === 'Group Stage') &&
    (m.home === team.name || m.away === team.name)
  );

  const matchCount = teamMatches.length;
  const displayName = team.name;
  const flag = team.flag;
  const group = team.group;
  const slug = team.slug;
  const customContent = loadTeamContent(slug);

  // Build MATCHES JS array for page — include full data + any persisted scores
  const matchesJs = teamMatches.map(m => {
    const sc = scores[m.id];
    const scorePart = sc
      ? `, homeScore:${sc.homeScore}, awayScore:${sc.awayScore}, status:${JSON.stringify(sc.status)}${sc.penaltyWinner ? `, penaltyWinner:${JSON.stringify(sc.penaltyWinner)}` : ''}`
      : '';
    return `  {id:${m.id}, home:${JSON.stringify(m.home)}, away:${JSON.stringify(m.away)}, utc:"${m.utc}"${scorePart}}`;
  }).join(',\n');

  // Build match cards
  const cards = teamMatches.map(m => {
    const isHome = m.home === team.name;
    const opp    = isHome ? m.away : m.home;
    const oppFlag= getFlag(opp);
    const homeFlag = isHome ? flag : oppFlag;
    const awayFlag = isHome ? oppFlag : flag;
    const homeName = m.home;
    const awayName = m.away;

    const utcLabel = fmtUtcLabel(m.utc);
    // copyMatch args — escape single quotes for JS inline handler
    const copyHome = m.home.replace(/'/g,"\\'");
    const copyAway = m.away.replace(/'/g,"\\'");
    const copyVenue = m.venue.replace(/'/g,"\\'");
    const copyCity  = m.city.replace(/'/g,"\\'");

    return `
        <article class="match-card" id="card-${m.id}" itemscope itemtype="https://schema.org/SportsEvent">
          <meta itemprop="name" content="${esc(m.home)} vs ${esc(m.away)} – 2026 FIFA World Cup">
          <meta itemprop="startDate" content="${m.utc}">
          <meta itemprop="location" content="${esc(m.venue)}, ${esc(m.city)}">
          <div class="card-accent"></div>
          <div class="card-body">
            <div class="card-meta">
              <span class="group-tag">Group ${m.group} &middot; Match ${m.id}</span>
            </div>
            <h3 class="match-h3">${esc(m.home)} vs ${esc(m.away)} &ndash; World Cup 2026 Kickoff Time</h3>
            <div class="teams-row">
              <div class="team-side">
                <div class="t-flag">${homeFlag}</div>
                <div class="t-name">${esc(m.home)}</div>
              </div>
              <div class="vs-block" id="vs-${m.id}"><span class="vs-text">VS</span></div>
              <div class="team-side">
                <div class="t-flag">${awayFlag}</div>
                <div class="t-name">${esc(m.away)}</div>
              </div>
            </div>
          </div>
          <div class="time-strip">
            <div class="ts-block highlight">
              <div class="ts-label">Your Local Time</div>
              <div class="ts-val" id="time-${m.id}">Loading...</div>
            </div>
            <div class="ts-block">
              <div class="ts-label">Date</div>
              <div class="ts-val" id="date-${m.id}">—</div>
            </div>
            <div class="ts-block">
              <div class="ts-label">Kickoff (UTC)</div>
              <div class="ts-val">${utcLabel}</div>
            </div>
            <div class="ts-block">
              <div class="ts-label">Venue</div>
              <div class="ts-val venue-val">📍 ${esc(m.venue)}, ${esc(m.city)}</div>
            </div>
          </div>
          <button class="copy-match-btn" onclick="copyMatch(${m.id}, '${copyHome}', '${copyAway}', '${copyVenue}', '${copyCity}')">📋 Copy kickoff time</button>
        </article>`;
  }).join('\n');

  // Group date range: group stage June 11–28
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js"></script>
<script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js"></script>

<script>
    window.ezstandalone = window.ezstandalone || {};
    ezstandalone.cmd = ezstandalone.cmd || [];
</script>

<meta charset="UTF-8">
<meta name="fo-verify" content="ff551aa5-0412-48f7-87ce-eb6cf70bfb9a" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6904183268749770"
     crossorigin="anonymous"></script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-N0RX6R0B5V"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-N0RX6R0B5V');
</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>What Time Is ${displayName} Playing? | World Cup 2026 Kickoff Times – myteamkickoff.com</title>
<meta name="description" content="See every ${displayName} match time at the 2026 FIFA World Cup in your local timezone. ${matchCount} fixtures including group stage kickoff times, venues, and dates. Free, instant, no signup.">
<meta property="og:title" content="What Time Is ${displayName} Playing? | World Cup 2026">
<meta property="og:description" content="See every ${displayName} match time at the 2026 FIFA World Cup in your local timezone. ${matchCount} fixtures including group stage kickoff times, venues, and dates. Free, instant, no signup.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://myteamkickoff.com/${slug}">
<meta property="og:image" content="https://myteamkickoff.com/og-image.png">
<link rel="canonical" href="https://myteamkickoff.com/${slug}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&family=Instrument+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${assetUrl('/assets/base.css')}">
<link rel="stylesheet" href="${assetUrl('/assets/team-page.css')}">
<link rel="stylesheet" href="/assets/nav-drop.css">
<script src="https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js" crossorigin="anonymous"></script>
</head>
<body>

<nav class="topnav">
  <a href="/" class="nav-logo">myteam<span>kickoff</span>.com</a>
  <button class="nav-menu-btn" id="navMenuBtn" aria-label="Open menu">☰</button>
  <div class="nav-links-wrap" id="navLinksWrap">
    <button class="nav-close-btn" id="navCloseBtn" aria-label="Close menu">✕</button>
    <a href="/" class="nav-home">← All Teams</a>
    <a href="/schedule/" class="nav-home">Schedule</a>
    <a href="/watch/" class="nav-home">Watch</a>
    <a href="/articles/" class="nav-home">Articles</a>
    <div class="nav-drop-wrap" id="navDropWrap">
    <a href="#" class="nav-home nav-drop-btn" id="navDropBtn" role="button" aria-haspopup="true" aria-expanded="false">🛠️ Tools ▾</a>
    <div class="nav-drop-menu" id="navDropMenu" role="menu">
      <a href="/wallchart/" class="nav-drop-item" role="menuitem">🗓️ Wallchart</a>
      <a href="/sweepstake-kit/" class="nav-drop-item" role="menuitem">🎲 Sweepstake Kit</a>
    </div>
  </div>
    <a href="/about/" class="nav-home">About</a>
    <a href="/contact/" class="nav-home">Contact</a>
  </div>
</nav>

<div class="hero">
  <div class="hero-inner">
    <div class="breadcrumb"><a href="/">All Teams</a> / ${esc(displayName)}</div>
    <div class="hero-flag">${flag}</div>
    <h1>What Time Is ${flag} ${esc(displayName)} Playing?</h1>
    <h2>${esc(displayName)} World Cup 2026 Schedule – Kickoff Times in Your Timezone</h2>
    <p class="hero-body">${esc(displayName)} are in Group ${group} at the 2026 FIFA World Cup, which runs from June 11 to July 19 across 16 stadiums in the USA, Canada, and Mexico. Below you'll find every ${esc(displayName)} group stage match with kickoff times automatically converted to your local timezone. Select your timezone above to get the exact time each ${esc(displayName)} game kicks off wherever you're watching from. No app, no signup — just ${esc(displayName)}'s full World Cup schedule in your time.</p>
    <div class="hero-stats">
      <div class="stat-chip">⚽ <strong>${matchCount}</strong> group stage matches</div>
      <div class="stat-chip">📅 <strong>Jun 11 – Jun 28</strong> Group Stage</div>
      <div class="stat-chip">🏆 <strong>Group ${group}</strong></div>
    </div>
  </div>
</div>


<div class="main">
  <div class="controls">
    <span class="tz-label">🌍 Your Timezone</span>
    <div class="select-wrap">
      <select id="tzSelect"></select>
    </div>
    <div class="now-badge" id="nowBadge">—</div>
  </div>

  <div class="section-label">Group Stage Fixtures</div>
  <div class="matches-grid">
${cards}
  </div>
${customContent}

  <div class="other-teams">
    <div class="other-teams-title">See Another Team's Schedule</div>
    <div class="team-links">
${otherTeamsHtml(slug)}
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>


<!-- FOOD GUIDE CALLOUT -->
<div class="food-guide-callout">
  <div class="fgc-icon">🍕</div>
  <div class="fgc-body">
    <div class="fgc-label">Viewing Party Food</div>
    <div class="fgc-text">What to eat when your team plays — recipes and snack ideas matched to every group.</div>
  </div>
  <a class="fgc-link" href="/articles/world-cup-food-guide/#group-${group.toLowerCase()}">See Group ${group} Food &amp; Recipes &#x2192;</a>
</div>

<!-- FROM THE FAN'S GUIDE -->
<section class="articles-teaser">
  <div class="at-header">
    <div class="at-title">From the Fan&#x27;s Guide</div>
    <a href="/articles/" class="at-browse">Browse all articles &#x2192;</a>
  </div>
  <div class="at-grid">
    <a href="/articles/how-does-the-2026-world-cup-format-work/" class="at-card">
      <picture>
      <source type="image/webp" srcset="/articles/how-does-the-2026-world-cup-format-work/og.webp">
      <img class="at-img" src="/articles/how-does-the-2026-world-cup-format-work/og.png" alt="Overhead view of a football pitch with 48 team flags arranged in 12 groups for the 2026 World Cup" loading="lazy">
      </picture>
      <div class="at-body">
      <div class="at-cat">Tournament Guide</div>
      <div class="at-card-title">How Does the New World Cup Format Work? The Complete Guide</div>
      <div class="at-card-meta">
        <span>&#x23F1; 7 min read</span>
        <span class="at-card-link">Read &#x2192;</span>
      </div>
      </div>
    </a>
    <a href="/articles/group-stage-predictions-every-group-ranked-by-difficulty/" class="at-card">
      <picture>
      <source type="image/webp" srcset="/articles/group-stage-predictions-every-group-ranked-by-difficulty/og.webp">
      <img class="at-img" src="/articles/group-stage-predictions-every-group-ranked-by-difficulty/og.png" alt="Twelve colourful international football flags arranged in a grid on a floodlit stadium pitch" loading="lazy">
      </picture>
      <div class="at-body">
      <div class="at-cat">Predictions &amp; Analysis</div>
      <div class="at-card-title">Group Stage Predictions: Every Group Ranked by Difficulty</div>
      <div class="at-card-meta">
        <span>&#x23F1; 9 min read</span>
        <span class="at-card-link">Read &#x2192;</span>
      </div>
      </div>
    </a>
    <a href="/articles/world-cup-2026-dark-horses/" class="at-card">
      <picture>
      <source type="image/webp" srcset="/articles/world-cup-2026-dark-horses/og.webp">
      <img class="at-img" src="/articles/world-cup-2026-dark-horses/og.png" alt="A lone footballer sprinting through dramatic tunnel lighting, symbolising a dark horse team" loading="lazy">
      </picture>
      <div class="at-body">
      <div class="at-cat">Analysis</div>
      <div class="at-card-title">World Cup 2026 Dark Horses: 5 Teams to Watch</div>
      <div class="at-card-meta">
        <span>&#x23F1; 6 min read</span>
        <span class="at-card-link">Read &#x2192;</span>
      </div>
      </div>
    </a>
  </div>
</section>

<footer>
  <strong><a href="/">myteamkickoff.com</a></strong> &middot; World Cup 2026 Kickoff Times in Your Timezone<br>
  🇺🇸 USA &middot; 🇨🇦 Canada &middot; 🇲🇽 Mexico &middot; June 11 – July 19, 2026<br>
  Times based on official FIFA schedule. All kickoffs converted from local venue time to UTC.<br>
  <a href="/privacy/">Privacy Policy</a> &middot; <a href="/about/">About</a> &middot; <a href="/contact/">Contact</a> &middot; &copy; 2026 myteamkickoff.com
</footer>

<script>
const TIMEZONES = [
  {label:"UTC-12:00 – Baker Island",tz:"Etc/GMT+12"},
  {label:"UTC-11:00 – American Samoa",tz:"Pacific/Pago_Pago"},
  {label:"UTC-10:00 – Hawaii",tz:"Pacific/Honolulu"},
  {label:"UTC-09:00 – Alaska",tz:"America/Anchorage"},
  {label:"UTC-08:00 – Los Angeles / Vancouver (PT)",tz:"America/Los_Angeles"},
  {label:"UTC-07:00 – Denver / Phoenix (MT)",tz:"America/Denver"},
  {label:"UTC-06:00 – Chicago / Mexico City (CT)",tz:"America/Chicago"},
  {label:"UTC-05:00 – New York / Toronto (ET)",tz:"America/New_York"},
  {label:"UTC-04:00 – Caracas / La Paz / Caribbean",tz:"America/Caracas"},
  {label:"UTC-03:00 – São Paulo / Buenos Aires",tz:"America/Sao_Paulo"},
  {label:"UTC-02:00 – South Georgia",tz:"Atlantic/South_Georgia"},
  {label:"UTC-01:00 – Azores",tz:"Atlantic/Azores"},
  {label:"UTC+00:00 – London / Lisbon / Accra (GMT)",tz:"Europe/London"},
  {label:"UTC+01:00 – Paris / Berlin / Lagos (CET)",tz:"Europe/Paris"},
  {label:"UTC+02:00 – Cairo / Johannesburg / Athens",tz:"Europe/Athens"},
  {label:"UTC+03:00 – Moscow / Nairobi / Riyadh",tz:"Europe/Moscow"},
  {label:"UTC+04:00 – Dubai / Baku",tz:"Asia/Dubai"},
  {label:"UTC+05:00 – Karachi / Tashkent",tz:"Asia/Karachi"},
  {label:"UTC+05:30 – Mumbai / New Delhi (IST)",tz:"Asia/Kolkata"},
  {label:"UTC+06:00 – Dhaka / Almaty",tz:"Asia/Dhaka"},
  {label:"UTC+07:00 – Bangkok / Jakarta",tz:"Asia/Bangkok"},
  {label:"UTC+08:00 – Beijing / Singapore / Perth",tz:"Asia/Singapore"},
  {label:"UTC+09:00 – Tokyo / Seoul (JST/KST)",tz:"Asia/Tokyo"},
  {label:"UTC+10:00 – Sydney / Melbourne (AEST)",tz:"Australia/Sydney"},
  {label:"UTC+11:00 – Solomon Islands",tz:"Pacific/Guadalcanal"},
  {label:"UTC+12:00 – Auckland / Fiji",tz:"Pacific/Auckland"},
];

const MATCHES = [
${matchesJs}
];

const sel = document.getElementById('tzSelect');
TIMEZONES.forEach(t => {
  const o = document.createElement('option');
  o.value = t.tz; o.textContent = t.label;
  sel.appendChild(o);
});
const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
const found = TIMEZONES.find(t => t.tz === detected);
let tz = found ? found.tz : 'America/New_York';
sel.value = tz;

function fmtTime(utc, tz) {
  return new Date(utc).toLocaleString('en-US', {timeZone:tz, hour:'2-digit', minute:'2-digit', hour12:true});
}
function fmtDate(utc, tz) {
  return new Date(utc).toLocaleString('en-US', {timeZone:tz, weekday:'short', month:'short', day:'numeric'});
}

function updateTimes() {
  MATCHES.forEach(m => {
    const te = document.getElementById('time-' + m.id);
    const de = document.getElementById('date-' + m.id);
    if (te) te.textContent = fmtTime(m.utc, tz);
    if (de) de.textContent = fmtDate(m.utc, tz);
  });
  document.getElementById('nowBadge').textContent =
    new Date().toLocaleString('en-US', {timeZone:tz, hour:'2-digit', minute:'2-digit', hour12:true, weekday:'short'});
}

sel.addEventListener('change', () => { tz = sel.value; updateTimes(); });
updateTimes();
setInterval(updateTimes, 60000);

function copyMatch(id, home, away, venue, city) {
  const m = MATCHES.find(x => x.id === id);
  if (!m) return;
  const text = \`⚽ World Cup 2026\\n\${home} vs \${away}\\n📅 \${fmtDate(m.utc, tz)}\\n⏰ \${fmtTime(m.utc, tz)}\\n📍 \${venue}, \${city}\`;
  navigator.clipboard.writeText(text).then(() => {
    const t = document.getElementById('toast');
    t.textContent = 'Match time copied!';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  });
}

// ─── LIVE SCORES ─────────────────────────────────────────────────
const ESPN_NAME_MAP = {
  "United States":"USA","Bosnia-Herzegovina":"Bosnia & Herz.",
  "Bosnia and Herzegovina":"Bosnia & Herz.","Ivory Coast":"Côte d'Ivoire",
  "Cote d'Ivoire":"Côte d'Ivoire","Turkey":"Türkiye",
  "Czech Republic":"Czechia","Democratic Republic of Congo":"DR Congo",
  "Congo DR":"DR Congo","Congo, DR":"DR Congo",
  "Republic of Korea":"South Korea","Korea Republic":"South Korea",
  "IR Iran":"Iran","United States of America":"USA",
};
function normName(n) { return ESPN_NAME_MAP[n] ?? n; }
function isLive(utc) { const n=Date.now(),s=new Date(utc).getTime(); return n>=s&&n<=s+2*3600*1000; }
function isPast(utc) { return new Date(utc).getTime()+2*3600*1000<Date.now(); }

const liveData = {};

function seedEmbeddedResults() {
  for (const m of MATCHES) {
    if (m.homeScore != null) {
      liveData[m.id] = { homeScore:m.homeScore, awayScore:m.awayScore, status:m.status||'final' };
    }
  }
}

function applyScoresToDom() {
  for (const m of MATCHES) {
    const card = document.getElementById('card-'+m.id);
    const vsEl  = document.getElementById('vs-'+m.id);
    if (!card || !vsEl) continue;

    const sd = liveData[m.id];
    const apiLive  = sd?.status === 'live';
    const apiFinal = sd?.status === 'final';
    const live  = apiLive  || (!sd && isLive(m.utc));
    const final = apiFinal || (!sd && isPast(m.utc));

    // Card visual state
    card.classList.toggle('live',  live);
    card.classList.toggle('final', !live && final);

    // Status tag
    const metaEl = card.querySelector('.card-meta');
    const existing = metaEl && metaEl.querySelector('.status-tag');
    if (existing) existing.remove();
    if (live) {
      const tag = document.createElement('span');
      tag.className = 'status-tag live-tag'; tag.textContent = '● Live';
      metaEl && metaEl.appendChild(tag);
    } else if (apiFinal) {
      const tag = document.createElement('span');
      tag.className = 'status-tag final-tag'; tag.textContent = 'Final';
      metaEl && metaEl.appendChild(tag);
    }

    // Score / VS display
    if (sd && (sd.status === 'live' || sd.status === 'final')) {
      const cls = sd.status === 'live' ? 'score-display score-live' : 'score-display';
      const clockHtml = sd.status === 'live' && sd.clock
        ? \`<div class="score-clock">\${sd.clock}</div>\` : '';
      vsEl.innerHTML = \`<div class="\${cls}"><span>\${sd.homeScore}</span><span class="score-sep">–</span><span>\${sd.awayScore}</span></div>\${clockHtml}\`;
    } else {
      vsEl.innerHTML = '<span class="vs-text">VS</span>';
    }
  }
}

async function fetchLiveData() {
  try {
    const res = await fetch('/api/scores');
    if (res.ok) {
      const { matches } = await res.json();
      for (const em of (matches || [])) {
        if (em.status === 'scheduled') continue;
        for (const m of MATCHES) {
          const eHome = normName(em.homeTeam), eAway = normName(em.awayTeam);
          const same = (eHome===m.home&&eAway===m.away)||(eHome===m.away&&eAway===m.home);
          if (!same || m.utc.slice(0,10) !== (em.date||'').slice(0,10)) continue;
          const homeFirst = eHome === m.home;
          liveData[m.id] = {
            homeScore: homeFirst ? em.homeScore : em.awayScore,
            awayScore: homeFirst ? em.awayScore : em.homeScore,
            status: em.status, clock: em.clock,
          };
          break;
        }
      }
    }
  } catch(e) { console.warn('Live data unavailable:', e); }
  applyScoresToDom();
}

seedEmbeddedResults();
applyScoresToDom();
fetchLiveData();
setInterval(fetchLiveData, 60000);
</script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  twemoji.parse(document.body, {
    folder: 'svg', ext: '.svg',
    base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/'
  });
});
</script>
<script>
(function(){var b=document.getElementById("navMenuBtn"),w=document.getElementById("navLinksWrap"),c=document.getElementById("navCloseBtn");if(!b||!w)return;b.addEventListener("click",function(){w.classList.add("open")});if(c)c.addEventListener("click",function(){w.classList.remove("open")});w.addEventListener("click",function(e){if(e.target.tagName==="A")w.classList.remove("open")})})();
</script>
</body>
</html>`;

  return html;
}

// ─── GENERATE TEAMS JS ARRAY STRING ──────────────────────────────────────────
function teamsArrayJs() {
  return 'const TEAMS = [\n' +
    TEAMS.map(t =>
      `  { name:${JSON.stringify(t.name)}, flag:${JSON.stringify(t.flag)}, group:${JSON.stringify(t.group)} }`
    ).join(',\n') +
    '\n];';
}

// ─── GENERATE MATCHES JS ARRAY STRING ────────────────────────────────────────
// scores: map of matchId (number) → {homeScore, awayScore, status}
function matchesArrayJs(scores = {}) {
  const lines = [];
  const stageComments = {
    'Group Stage': 'GROUP STAGE',
    'Round of 32': 'ROUND OF 32',
    'Round of 16': 'ROUND OF 16',
    'Quarterfinal': 'QUARTERFINALS',
    'Semifinal': 'SEMIFINALS',
    'Third Place Playoff': 'THIRD PLACE PLAYOFF',
    'Final': 'FINAL',
  };
  let lastStage = null;
  let lastGrp = null;

  lines.push('const MATCHES = [');
  for (const m of MATCHES) {
    if (m.stage !== lastStage) {
      lines.push(`  // ${stageComments[m.stage]}`);
      lastStage = m.stage;
      lastGrp = null;
    }
    if (m.stage === 'Group Stage' && m.group !== lastGrp) {
      const grpTeams = TEAMS.filter(t => t.group === m.group).map(t=>t.name).join(', ');
      lines.push(`  // Group ${m.group}: ${grpTeams}`);
      lastGrp = m.group;
    }
    const sc = scores[m.id];
    const scorePart = sc
      ? `, homeScore:${sc.homeScore}, awayScore:${sc.awayScore}, status:${JSON.stringify(sc.status)}${sc.penaltyWinner ? `, penaltyWinner:${JSON.stringify(sc.penaltyWinner)}` : ''}`
      : '';
    lines.push(
      `  {id:${m.id}, stage:${JSON.stringify(m.stage)}, group:${JSON.stringify(m.group)}, ` +
      `home:${JSON.stringify(m.home)}, away:${JSON.stringify(m.away)}, ` +
      `utc:${JSON.stringify(m.utc)}, venue:${JSON.stringify(m.venue)}, city:${JSON.stringify(m.city)}${scorePart}},`
    );
  }
  lines.push('];');
  return lines.join('\n');
}

// ─── FETCH STANDINGS AT BUILD TIME ────────────────────────────────────────────
async function fetchStandings() {
  const ESPN_NORM = {
    'United States': 'USA', 'United States of America': 'USA',
    'Bosnia-Herzegovina': 'Bosnia & Herz.', 'Bosnia and Herzegovina': 'Bosnia & Herz.',
    'Ivory Coast': "Côte d'Ivoire", "Cote d'Ivoire": "Côte d'Ivoire",
    'Turkey': 'Türkiye', 'Czech Republic': 'Czechia',
    'Democratic Republic of Congo': 'DR Congo', 'Congo DR': 'DR Congo', 'Congo, DR': 'DR Congo',
    'Republic of Korea': 'South Korea', 'Korea Republic': 'South Korea',
    'IR Iran': 'Iran',
  };
  function norm(n) { return ESPN_NORM[n] ?? n; }
  try {
    const url = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) { console.warn('⚠️  ESPN standings returned', res.status); return {}; }
    const data = await res.json();
    const groups = {};
    for (const group of (data.children ?? [])) {
      const rawName = (group.name ?? '').replace(/^Group\s+/i, '').trim();
      if (!rawName) continue;
      const entries = (group.standings?.entries ?? []);
      // Sort by ESPN's authoritative note.rank, falling back to source order
      const sorted = [...entries].sort((a, b) =>
        (a.note?.rank ?? 99) - (b.note?.rank ?? 99)
      );
      groups[rawName] = sorted.map((e, i) => {
        const stats = e.stats ?? [];
        const getStat = (name) => parseInt(stats.find(s => s.name === name)?.value ?? '0', 10) || 0;
        return {
          team: norm(e.team?.displayName ?? ''),
          position: (e.note?.rank ?? i + 1),
          points: getStat('points'),
          gd: getStat('pointDifferential'),
          gf: getStat('pointsFor'),
        };
      });
    }
    const count = Object.keys(groups).length;
    if (count) console.log(`🏆 Fetched standings for ${count} group(s)`);
    else console.warn('⚠️  ESPN standings returned no groups');
    return groups;
  } catch (e) {
    console.warn('⚠️  Could not fetch standings:', e.message);
    return {};
  }
}

// ─── FETCH KNOCKOUT SCORES AT BUILD TIME ──────────────────────────────────────
// Fetches completed knockout results from ESPN (R32 through Final) and returns
// a scores map keyed by match ID, suitable for passing to matchesArrayJs().
// Requires standings data to resolve group-stage placeholder codes (1A, 2B, etc.)
// before matching against ESPN team names.
async function fetchKnockoutScores(standings = {}) {
  const ESPN_NORM = {
    'United States': 'USA', 'United States of America': 'USA',
    'Bosnia-Herzegovina': 'Bosnia & Herz.', 'Bosnia and Herzegovina': 'Bosnia & Herz.',
    'Ivory Coast': "Côte d'Ivoire", "Cote d'Ivoire": "Côte d'Ivoire",
    'Turkey': 'Türkiye', 'Czech Republic': 'Czechia',
    'Democratic Republic of Congo': 'DR Congo', 'Congo DR': 'DR Congo', 'Congo, DR': 'DR Congo',
    'Republic of Korea': 'South Korea', 'Korea Republic': 'South Korea',
    'IR Iran': 'Iran',
  };
  function norm(n) { return ESPN_NORM[n] ?? n; }

  // Step 1: Build resolvedTeams from standings (mirrors browser processStandings)
  const resolvedTeams = {};
  for (const [grp, entries] of Object.entries(standings)) {
    entries.forEach((e, i) => { resolvedTeams[`${i+1}${grp}`] = e.team; });
  }

  // Apply FIFA 2026 third-place allocation table (same as browser)
  const thirds = [];
  for (const [grp, entries] of Object.entries(standings)) {
    if (entries.length >= 3) thirds.push({ group: grp, team: entries[2].team,
      points: entries[2].points, gd: entries[2].gd, gf: entries[2].gf });
  }
  thirds.sort((a, b) =>
    b.points !== a.points ? b.points - a.points :
    b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf
  );
  const thirdCodes = [...new Set(
    MATCHES.flatMap(m => [m.home, m.away]).filter(t => /^3[A-L]/.test(t))
  )];
  const top8 = thirds.slice(0, thirdCodes.length);
  const FIFA_THIRD_PLACE_TABLE = {
    'BDEFIJKL': {
      '3A/B/C/D/F':'D','3C/D/F/G/H':'F','3C/E/F/H/I':'E',
      '3A/E/H/I/J':'I','3E/H/I/J/K':'K','3E/F/G/I/J':'J',
      '3B/E/F/I/J':'B','3D/E/I/J/L':'L'
    }
  };
  const comboKey = top8.map(t => t.group).sort().join('');
  const tableEntry = FIFA_THIRD_PLACE_TABLE[comboKey];
  if (tableEntry) {
    const teamByGroup = {};
    for (const t of top8) teamByGroup[t.group] = t.team;
    for (const [slot, grp] of Object.entries(tableEntry)) {
      if (teamByGroup[grp]) resolvedTeams[slot] = teamByGroup[grp];
    }
  } else {
    const sortedCodes = [...thirdCodes].sort((a, b) => {
      const ag = a.slice(1).split('/'), bg = b.slice(1).split('/');
      return top8.filter(t => ag.includes(t.group)).length -
             top8.filter(t => bg.includes(t.group)).length;
    });
    const used = new Set();
    function assignThird(i) {
      if (i === sortedCodes.length) return true;
      const code = sortedCodes[i];
      const allowed = code.slice(1).split('/');
      for (const t of top8) {
        if (allowed.includes(t.group) && !used.has(t.group)) {
          resolvedTeams[code] = t.team;
          used.add(t.group);
          if (assignThird(i + 1)) return true;
          delete resolvedTeams[code];
          used.delete(t.group);
        }
      }
      return false;
    }
    assignThird(0);
  }

  // Step 2: Fetch ESPN scoreboard for the full knockout bracket window
  // (June 28 – July 20). ESPN supports YYYYMMDD-YYYYMMDD range queries.
  let espnMatches = [];
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260628-20260720&limit=100';
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      for (const evt of (data.events ?? [])) {
        for (const comp of (evt.competitions ?? [])) {
          const competitors = comp.competitors ?? [];
          const home = competitors.find(x => x.homeAway === 'home');
          const away = competitors.find(x => x.homeAway === 'away');
          const statusType = comp.status?.type;
          const completed = statusType?.completed ?? false;
          const state = statusType?.state ?? 'pre';
          const hs = parseInt(home?.score ?? '0', 10) || 0;
          const as_ = parseInt(away?.score ?? '0', 10) || 0;
          let penaltyWinner;
          if (hs === as_ && completed) {
            if (home?.winner === true) penaltyWinner = norm(home?.team?.displayName ?? '');
            else if (away?.winner === true) penaltyWinner = norm(away?.team?.displayName ?? '');
          }
          espnMatches.push({
            homeTeam: norm(home?.team?.displayName ?? ''),
            awayTeam: norm(away?.team?.displayName ?? ''),
            homeScore: hs,
            awayScore: as_,
            status: completed ? 'final' : state === 'in' ? 'live' : 'scheduled',
            date: evt.date ?? '',
            ...(penaltyWinner ? { penaltyWinner } : {}),
          });
        }
      }
    }
  } catch (e) {
    console.warn('⚠️  Could not fetch knockout scores from ESPN:', e.message);
    return {};
  }

  // Step 3: Match ESPN results against MATCHES entries in ID order.
  // Process in order so R32 winners are known before R16 matching, etc.
  const knockoutMatches = MATCHES.filter(m => m.stage !== 'Group Stage');
  const scores = {};

  for (const m of knockoutMatches) {
    const mHome = resolvedTeams[m.home] || m.home;
    const mAway = resolvedTeams[m.away] || m.away;

    // Skip if either team is still an unresolved placeholder (prior result unknown)
    if (mHome === m.home || mAway === m.away) continue;

    const mDate = m.utc.slice(0, 10);
    for (const em of espnMatches) {
      if (em.status === 'scheduled') continue;
      const eDate = (em.date || '').slice(0, 10);
      const sameTeams =
        (em.homeTeam === mHome && em.awayTeam === mAway) ||
        (em.homeTeam === mAway && em.awayTeam === mHome);
      if (!sameTeams || eDate !== mDate) continue;

      const homeFirst = (em.homeTeam === mHome);
      const hs = homeFirst ? em.homeScore : em.awayScore;
      const as_ = homeFirst ? em.awayScore : em.homeScore;

      if (em.status === 'final') {
        const sc = { homeScore: hs, awayScore: as_, status: 'final' };
        let winner, loser;
        if (hs !== as_) {
          winner = hs > as_ ? mHome : mAway;
          loser  = hs > as_ ? mAway : mHome;
        } else if (em.penaltyWinner) {
          winner = em.penaltyWinner === em.homeTeam ? mHome : mAway;
          loser  = em.penaltyWinner === em.homeTeam ? mAway : mHome;
          sc.penaltyWinner = winner;
        }
        scores[m.id] = sc;
        if (winner) {
          // Resolve winner code so subsequent rounds can be matched
          if      (m.id >= 73 && m.id <= 88) resolvedTeams[`R32 W${m.id - 72}`] = winner;
          else if (m.id >= 89 && m.id <= 96) resolvedTeams[`R16 W${m.id - 88}`] = winner;
          else if (m.id >= 97 && m.id <= 100) resolvedTeams[`QF W${m.id - 96}`]  = winner;
          else if (m.id === 101) { resolvedTeams['SF W1'] = winner; resolvedTeams['SF L1'] = loser; }
          else if (m.id === 102) { resolvedTeams['SF W2'] = winner; resolvedTeams['SF L2'] = loser; }
        }
      } else if (em.status === 'live') {
        const kickoffMs = new Date(m.utc).getTime();
        const staleLive = Date.now() - kickoffMs > 3 * 60 * 60 * 1000;
        if (staleLive) {
          // ESPN is stuck — treat as final so it doesn't get baked in as live
          const sc = { homeScore: hs, awayScore: as_, status: 'final' };
          let winner, loser;
          if (hs !== as_) {
            winner = hs > as_ ? mHome : mAway;
            loser  = hs > as_ ? mAway : mHome;
          }
          scores[m.id] = sc;
          if (winner) {
            if      (m.id >= 73 && m.id <= 88) resolvedTeams[`R32 W${m.id - 72}`] = winner;
            else if (m.id >= 89 && m.id <= 96) resolvedTeams[`R16 W${m.id - 88}`] = winner;
            else if (m.id >= 97 && m.id <= 100) resolvedTeams[`QF W${m.id - 96}`]  = winner;
            else if (m.id === 101) { resolvedTeams['SF W1'] = winner; resolvedTeams['SF L1'] = loser; }
            else if (m.id === 102) { resolvedTeams['SF W2'] = winner; resolvedTeams['SF L2'] = loser; }
          }
        } else {
          scores[m.id] = { homeScore: hs, awayScore: as_, status: 'live' };
        }
      }
      break;
    }
  }

  const count = Object.keys(scores).length;
  if (count > 0) console.log(`⚽ Embedded ${count} knockout result(s) from ESPN`);
  else           console.log('ℹ️  No completed knockout results found yet');
  return scores;
}

// ─── PATCH INDEX.HTML ─────────────────────────────────────────────────────────
// scores: pre-merged map of matchId → {homeScore, awayScore, status} from
//         results.json + live ESPN data.  Caller is responsible for merging.
function patchIndexHtml(standings = {}, scores = {}) {
  const indexPath = path.join(__dirname, '..', 'site', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Replace TEAMS array
  html = html.replace(
    /const TEAMS = \[[\s\S]*?\];(\s*\n)/,
    teamsArrayJs() + '\n'
  );

  // Replace MATCHES array (scores from results.json are embedded to preserve them)
  html = html.replace(
    /const MATCHES = \[[\s\S]*?\];(\s*\n)/,
    matchesArrayJs(scores) + '\n'
  );

  // Replace resolveKnockout()
  // R32 W n = winner of match 76+n (IDs 77-92)
  // R16 W n = winner of match 92+n (IDs 93-100)
  // QF  W n = winner of match 100+n (IDs 101-104)
  // SF W/L 1,2 = winner/loser of matches 105,106
  const newResolve = `function resolveKnockout() {
  function res(code) { return resolvedTeams[code] || code; }
  for (let n = 1; n <= 16; n++) { const w = matchWinners[72+n]; if (w) resolvedTeams[\`R32 W\${n}\`] = res(w); }
  for (let n = 1; n <= 8;  n++) { const w = matchWinners[88+n]; if (w) resolvedTeams[\`R16 W\${n}\`] = res(w); }
  for (let n = 1; n <= 4;  n++) { const w = matchWinners[96+n]; if (w) resolvedTeams[\`QF W\${n}\`] = res(w); }
  if (matchWinners[101]) resolvedTeams['SF W1'] = res(matchWinners[101]);
  if (matchWinners[102]) resolvedTeams['SF W2'] = res(matchWinners[102]);
  if (matchLosers[101])  resolvedTeams['SF L1'] = res(matchLosers[101]);
  if (matchLosers[102])  resolvedTeams['SF L2'] = res(matchLosers[102]);
}`;

  html = html.replace(
    /function resolveKnockout\(\) \{[\s\S]*?\n\}/,
    newResolve
  );

  // Also fix the footer match count
  html = html.replace(
    /All \d+ fixtures/,
    'All 104 fixtures'
  );

  // Fix page desc match count
  html = html.replace(
    /All \d+ matches\./,
    'All 104 matches.'
  );

  // Inject build-time standings so knockout slots resolve immediately on page load.
  // Replaces the `const STANDINGS = {};` sentinel written by this script.
  if (Object.keys(standings).length) {
    html = html.replace(
      /const STANDINGS = \{[\s\S]*?\};/,
      `const STANDINGS = ${JSON.stringify(standings)};`
    );
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Patched site/index.html');
}

// ─── PATCH SCHEDULE.HTML ──────────────────────────────────────────────────────
function patchScheduleHtml(scores = {}, standings = {}) {
  const schedulePath = path.join(__dirname, '..', 'site', 'schedule', 'index.html');
  if (!fs.existsSync(schedulePath)) {
    console.warn('⚠️  site/schedule/index.html not found — skipping');
    return;
  }
  let html = fs.readFileSync(schedulePath, 'utf8');

  // Build TEAMS array for schedule page (no slug field)
  const schedTeams = ['const TEAMS = ['];
  for (const t of TEAMS) {
    schedTeams.push(`  { name:${JSON.stringify(t.name)}, flag:${JSON.stringify(t.flag)}, group:${JSON.stringify(t.group)} },`);
  }
  schedTeams.push('];');

  html = html.replace(
    /const TEAMS = \[[\s\S]*?\];(\s*\n)/,
    schedTeams.join('\n') + '\n'
  );

  // Pass scores so embedded results from results.json are preserved in schedule page too
  html = html.replace(
    /const MATCHES = \[[\s\S]*?\];(\s*\n)/,
    matchesArrayJs(scores) + '\n'
  );

  // Inject build-time standings so knockout slots resolve immediately on page load.
  if (Object.keys(standings).length) {
    html = html.replace(
      /const STANDINGS = \{[\s\S]*?\};/,
      `const STANDINGS = ${JSON.stringify(standings)};`
    );
  }

  fs.writeFileSync(schedulePath, html, 'utf8');
  console.log('✅ Patched site/schedule/index.html');
}

// ─── TEAMS TO REMOVE ──────────────────────────────────────────────────────────
const VALID_SLUGS = new Set(TEAMS.map(t => t.slug));
const KNOWN_DIRS = [
  'albania','argentina','australia','austria','bahrain','belgium','bosnia','brazil',
  'cameroon','canada','chile','colombia','costa-rica','cote-divoire','croatia',
  'czechia','denmark','dr-congo','ecuador','england','france','germany','honduras',
  'iran','italy','jamaica','japan','mexico','morocco','netherlands','new-zealand',
  'nigeria','paraguay','peru','portugal','qatar','saudi-arabia','senegal','serbia',
  'south-africa','south-korea','spain','switzerland','tunisia','turkiye','ukraine',
  'uruguay','usa',
];
const DIRS_TO_REMOVE = KNOWN_DIRS.filter(d => !VALID_SLUGS.has(d));

// ─── MAIN ─────────────────────────────────────────────────────────────────────
(async function main() {
  const siteDir = path.join(__dirname, '..', 'site');
  const resultsPath = path.join(siteDir, 'results.json');

  // Load results.json once — shared by all patchers and team page generators
  let scores = {};
  if (fs.existsSync(resultsPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      for (const [k, v] of Object.entries(raw)) {
        scores[Number(k)] = v;
      }
      if (Object.keys(scores).length > 0) {
        console.log(`📊 Loaded ${Object.keys(scores).length} result(s) from results.json`);
      }
    } catch (e) {
      console.warn('⚠️  Could not parse results.json:', e.message);
    }
  }

  // Fetch current standings from ESPN so knockout slots can be resolved at build time
  const standings = await fetchStandings();

  // Fetch completed knockout results from ESPN and merge with results.json scores.
  // results.json (group stage) takes priority; ESPN knockout data fills in the rest.
  const knockoutScores = await fetchKnockoutScores(standings);
  const knockoutCachePath = path.join(siteDir, 'knockout-scores.json');

  let effectiveKnockoutScores = knockoutScores;
  if (Object.keys(knockoutScores).length > 0) {
    // Fresh data — persist it so future runs can fall back to it if ESPN is down
    try {
      fs.writeFileSync(knockoutCachePath, JSON.stringify(knockoutScores, null, 2), 'utf8');
    } catch (e) {
      console.warn('⚠️  Could not write knockout scores cache:', e.message);
    }
  } else {
    // ESPN returned nothing (API error or 0 results) — try the last-known-good cache
    if (fs.existsSync(knockoutCachePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(knockoutCachePath, 'utf8'));
        const rebuilt = {};
        for (const [k, v] of Object.entries(raw)) {
          rebuilt[Number(k)] = v;
        }
        const cachedCount = Object.keys(rebuilt).length;
        if (cachedCount > 0) {
          console.warn(`⚠️  ESPN returned no knockout data — using cached ${cachedCount} result(s) from previous run to avoid blanking the bracket`);
          effectiveKnockoutScores = rebuilt;
        }
      } catch (e) {
        console.warn('⚠️  Could not read knockout scores cache:', e.message);
      }
    }
  }

  const allScores = { ...scores, ...effectiveKnockoutScores };

  // 1. Patch index.html and schedule page (both get embedded scores + standings)
  patchIndexHtml(standings, allScores);
  patchScheduleHtml(allScores, standings);

  // 2. Remove obsolete team dirs
  for (const dir of DIRS_TO_REMOVE) {
    const p = path.join(siteDir, dir);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`🗑️  Removed site/${dir}/`);
    }
  }

  // 3. Generate / overwrite all 48 team pages (with embedded scores for static fallback)
  for (const team of TEAMS) {
    const teamDir = path.join(siteDir, team.slug);
    if (!fs.existsSync(teamDir)) {
      fs.mkdirSync(teamDir, { recursive: true });
    }
    const html = generateTeamPage(team, scores);
    fs.writeFileSync(path.join(teamDir, 'index.html'), html, 'utf8');
    console.log(`📄 Generated site/${team.slug}/index.html`);
  }

  console.log('\n✅ Done! All team pages generated and index.html patched.');
  console.log(`   Teams in draw: ${TEAMS.length}`);
  console.log(`   Matches total: ${MATCHES.length}`);
  console.log(`   Dirs removed:  ${DIRS_TO_REMOVE.join(', ')}`);
})();
