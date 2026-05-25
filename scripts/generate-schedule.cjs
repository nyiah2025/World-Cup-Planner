#!/usr/bin/env node
/**
 * generate-schedule.js
 * Rebuilds the entire World Cup 2026 schedule:
 *  1. Patches TEAMS, MATCHES, and resolveKnockout() in site/index.html
 *  2. Regenerates all 48 individual team pages under site/<slug>/index.html
 *  3. Removes team directories that are no longer in the tournament
 */

const fs   = require('fs');
const path = require('path');

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
  {id:26, stage:"Group Stage", group:"A", home:"Mexico",        away:"South Korea",   utc:"2026-06-19T02:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:51, stage:"Group Stage", group:"A", home:"Czechia",       away:"Mexico",        utc:"2026-06-25T02:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:52, stage:"Group Stage", group:"A", home:"South Africa",  away:"South Korea",   utc:"2026-06-25T02:00:00Z", venue:"Estadio Akron",           city:"Guadalajara, MEX"},

  // GROUP B: Canada, Bosnia & Herz., Qatar, Switzerland
  {id:3,  stage:"Group Stage", group:"B", home:"Canada",        away:"Switzerland",   utc:"2026-06-13T02:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:4,  stage:"Group Stage", group:"B", home:"Qatar",         away:"Bosnia & Herz.",utc:"2026-06-13T01:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:27, stage:"Group Stage", group:"B", home:"Bosnia & Herz.",away:"Switzerland",   utc:"2026-06-19T02:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:28, stage:"Group Stage", group:"B", home:"Canada",        away:"Qatar",         utc:"2026-06-19T01:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:49, stage:"Group Stage", group:"B", home:"Switzerland",   away:"Canada",        utc:"2026-06-25T00:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:50, stage:"Group Stage", group:"B", home:"Bosnia & Herz.",away:"Qatar",         utc:"2026-06-24T19:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},

  // GROUP C: Brazil, Morocco, Haiti, Scotland
  {id:7,  stage:"Group Stage", group:"C", home:"Brazil",        away:"Morocco",       utc:"2026-06-13T22:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:8,  stage:"Group Stage", group:"C", home:"Haiti",         away:"Scotland",      utc:"2026-06-13T17:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:31, stage:"Group Stage", group:"C", home:"Morocco",       away:"Scotland",      utc:"2026-06-19T22:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:32, stage:"Group Stage", group:"C", home:"Brazil",        away:"Haiti",         utc:"2026-06-19T23:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:53, stage:"Group Stage", group:"C", home:"Scotland",      away:"Brazil",        utc:"2026-06-25T01:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:54, stage:"Group Stage", group:"C", home:"Morocco",       away:"Haiti",         utc:"2026-06-25T01:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},

  // GROUP D: USA, Paraguay, Australia, Türkiye
  {id:5,  stage:"Group Stage", group:"D", home:"USA",           away:"Paraguay",      utc:"2026-06-12T23:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:6,  stage:"Group Stage", group:"D", home:"Australia",     away:"Türkiye",       utc:"2026-06-12T23:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:29, stage:"Group Stage", group:"D", home:"Paraguay",      away:"Türkiye",       utc:"2026-06-19T22:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:30, stage:"Group Stage", group:"D", home:"USA",           away:"Australia",     utc:"2026-06-20T02:00:00Z", venue:"Levi's Stadium",          city:"San Francisco, USA"},
  {id:55, stage:"Group Stage", group:"D", home:"Türkiye",       away:"USA",           utc:"2026-06-26T01:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:56, stage:"Group Stage", group:"D", home:"Paraguay",      away:"Australia",     utc:"2026-06-26T01:00:00Z", venue:"Levi's Stadium",          city:"San Francisco, USA"},

  // GROUP E: Germany, Curaçao, Côte d'Ivoire, Ecuador
  {id:9,  stage:"Group Stage", group:"E", home:"Germany",       away:"Curaçao",       utc:"2026-06-14T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:10, stage:"Group Stage", group:"E", home:"Côte d'Ivoire", away:"Ecuador",       utc:"2026-06-14T23:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:33, stage:"Group Stage", group:"E", home:"Curaçao",       away:"Ecuador",       utc:"2026-06-20T17:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:34, stage:"Group Stage", group:"E", home:"Germany",       away:"Côte d'Ivoire", utc:"2026-06-20T23:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:59, stage:"Group Stage", group:"E", home:"Ecuador",       away:"Germany",       utc:"2026-06-27T00:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:60, stage:"Group Stage", group:"E", home:"Curaçao",       away:"Côte d'Ivoire", utc:"2026-06-27T00:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},

  // GROUP F: Netherlands, Japan, Sweden, Tunisia
  {id:11, stage:"Group Stage", group:"F", home:"Netherlands",   away:"Sweden",        utc:"2026-06-14T22:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:12, stage:"Group Stage", group:"F", home:"Japan",         away:"Tunisia",       utc:"2026-06-15T02:00:00Z", venue:"Estadio BBVA",            city:"Monterrey, MEX"},
  {id:35, stage:"Group Stage", group:"F", home:"Sweden",        away:"Tunisia",       utc:"2026-06-20T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:36, stage:"Group Stage", group:"F", home:"Netherlands",   away:"Japan",         utc:"2026-06-21T04:00:00Z", venue:"Estadio BBVA",            city:"Monterrey, MEX"},
  {id:61, stage:"Group Stage", group:"F", home:"Tunisia",       away:"Netherlands",   utc:"2026-06-26T23:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:62, stage:"Group Stage", group:"F", home:"Sweden",        away:"Japan",         utc:"2026-06-26T23:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},

  // GROUP G: Belgium, Egypt, Iran, New Zealand
  {id:15, stage:"Group Stage", group:"G", home:"Belgium",       away:"Egypt",         utc:"2026-06-15T19:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:16, stage:"Group Stage", group:"G", home:"Iran",          away:"New Zealand",   utc:"2026-06-16T01:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:37, stage:"Group Stage", group:"G", home:"Belgium",       away:"Iran",          utc:"2026-06-21T19:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:38, stage:"Group Stage", group:"G", home:"Egypt",         away:"New Zealand",   utc:"2026-06-21T23:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:57, stage:"Group Stage", group:"G", home:"New Zealand",   away:"Belgium",       utc:"2026-06-26T21:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:58, stage:"Group Stage", group:"G", home:"Egypt",         away:"Iran",          utc:"2026-06-26T21:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},

  // GROUP H: Spain, Cape Verde, Saudi Arabia, Uruguay
  {id:13, stage:"Group Stage", group:"H", home:"Spain",         away:"Uruguay",       utc:"2026-06-15T17:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:14, stage:"Group Stage", group:"H", home:"Saudi Arabia",  away:"Cape Verde",    utc:"2026-06-15T23:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:39, stage:"Group Stage", group:"H", home:"Uruguay",       away:"Cape Verde",    utc:"2026-06-21T17:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:40, stage:"Group Stage", group:"H", home:"Spain",         away:"Saudi Arabia",  utc:"2026-06-21T19:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:63, stage:"Group Stage", group:"H", home:"Cape Verde",    away:"Spain",         utc:"2026-06-26T19:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:64, stage:"Group Stage", group:"H", home:"Uruguay",       away:"Saudi Arabia",  utc:"2026-06-26T19:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},

  // GROUP I: France, Senegal, Iraq, Norway
  {id:17, stage:"Group Stage", group:"I", home:"France",        away:"Senegal",       utc:"2026-06-16T17:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:18, stage:"Group Stage", group:"I", home:"Iraq",          away:"Norway",        utc:"2026-06-16T22:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:41, stage:"Group Stage", group:"I", home:"Senegal",       away:"Norway",        utc:"2026-06-22T17:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:42, stage:"Group Stage", group:"I", home:"France",        away:"Iraq",          utc:"2026-06-22T22:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:67, stage:"Group Stage", group:"I", home:"Norway",        away:"France",        utc:"2026-06-27T17:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:68, stage:"Group Stage", group:"I", home:"Senegal",       away:"Iraq",          utc:"2026-06-27T17:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},

  // GROUP J: Argentina, Algeria, Austria, Jordan
  {id:19, stage:"Group Stage", group:"J", home:"Argentina",     away:"Algeria",       utc:"2026-06-17T01:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:20, stage:"Group Stage", group:"J", home:"Austria",       away:"Jordan",        utc:"2026-06-17T04:00:00Z", venue:"Levi's Stadium",          city:"San Francisco, USA"},
  {id:43, stage:"Group Stage", group:"J", home:"Argentina",     away:"Austria",       utc:"2026-06-22T17:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:44, stage:"Group Stage", group:"J", home:"Algeria",       away:"Jordan",        utc:"2026-06-23T03:00:00Z", venue:"Levi's Stadium",          city:"San Francisco, USA"},
  {id:65, stage:"Group Stage", group:"J", home:"Algeria",       away:"Austria",       utc:"2026-06-28T02:00:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:66, stage:"Group Stage", group:"J", home:"Jordan",        away:"Argentina",     utc:"2026-06-28T02:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},

  // GROUP K: Portugal, DR Congo, Uzbekistan, Colombia
  {id:21, stage:"Group Stage", group:"K", home:"Portugal",      away:"Colombia",      utc:"2026-06-17T17:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:22, stage:"Group Stage", group:"K", home:"DR Congo",      away:"Uzbekistan",    utc:"2026-06-17T23:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:45, stage:"Group Stage", group:"K", home:"Portugal",      away:"DR Congo",      utc:"2026-06-23T17:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:46, stage:"Group Stage", group:"K", home:"Colombia",      away:"Uzbekistan",    utc:"2026-06-23T23:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:69, stage:"Group Stage", group:"K", home:"Uzbekistan",    away:"Portugal",      utc:"2026-06-28T00:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:70, stage:"Group Stage", group:"K", home:"Colombia",      away:"DR Congo",      utc:"2026-06-27T21:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},

  // GROUP L: England, Croatia, Ghana, Panama
  {id:23, stage:"Group Stage", group:"L", home:"England",       away:"Croatia",       utc:"2026-06-17T20:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:24, stage:"Group Stage", group:"L", home:"Ghana",         away:"Panama",        utc:"2026-06-17T23:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:47, stage:"Group Stage", group:"L", home:"England",       away:"Ghana",         utc:"2026-06-23T20:00:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:48, stage:"Group Stage", group:"L", home:"Panama",        away:"Croatia",       utc:"2026-06-23T23:00:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},
  {id:71, stage:"Group Stage", group:"L", home:"Panama",        away:"England",       utc:"2026-06-27T21:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:72, stage:"Group Stage", group:"L", home:"Croatia",       away:"Ghana",         utc:"2026-06-27T21:00:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},

  // ROUND OF 32 (IDs 77–92; R32 Wn = winner of match 76+n)
  {id:73,  stage:"Round of 32", group:"—", home:"2A",      away:"2B",          utc:"2026-06-28T19:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:74,  stage:"Round of 32", group:"—", home:"1E",      away:"3A/B/C/D/F",  utc:"2026-06-29T20:30:00Z", venue:"Gillette Stadium",        city:"Boston, USA"},
  {id:75,  stage:"Round of 32", group:"—", home:"1F",      away:"2C",          utc:"2026-06-30T01:00:00Z", venue:"Estadio BBVA",            city:"Monterrey, MEX"},
  {id:76,  stage:"Round of 32", group:"—", home:"1C",      away:"2F",          utc:"2026-06-29T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:77,  stage:"Round of 32", group:"—", home:"1I",      away:"3C/D/F/G/H",  utc:"2026-06-30T21:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:78,  stage:"Round of 32", group:"—", home:"2E",      away:"2I",          utc:"2026-06-30T17:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:79,  stage:"Round of 32", group:"—", home:"1A",      away:"3C/E/F/H/I",  utc:"2026-07-01T01:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:80,  stage:"Round of 32", group:"—", home:"1L",      away:"3E/H/I/J/K",  utc:"2026-07-01T16:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:81,  stage:"Round of 32", group:"—", home:"1D",      away:"3B/E/F/I/J",  utc:"2026-07-02T00:00:00Z", venue:"Levi's Stadium",          city:"San Francisco, USA"},
  {id:82,  stage:"Round of 32", group:"—", home:"1G",      away:"3A/E/H/I/J",  utc:"2026-07-01T20:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:83,  stage:"Round of 32", group:"—", home:"2K",      away:"2L",          utc:"2026-07-02T23:00:00Z", venue:"BMO Field",               city:"Toronto, CAN"},
  {id:84,  stage:"Round of 32", group:"—", home:"1H",      away:"2J",          utc:"2026-07-02T19:00:00Z", venue:"SoFi Stadium",            city:"Los Angeles, USA"},
  {id:85,  stage:"Round of 32", group:"—", home:"1B",      away:"3E/F/G/I/J",  utc:"2026-07-03T03:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},
  {id:86,  stage:"Round of 32", group:"—", home:"1J",      away:"2H",          utc:"2026-07-03T22:00:00Z", venue:"Hard Rock Stadium",       city:"Miami, USA"},
  {id:87,  stage:"Round of 32", group:"—", home:"1K",      away:"3D/E/I/J/L",  utc:"2026-07-04T01:30:00Z", venue:"Arrowhead Stadium",       city:"Kansas City, USA"},
  {id:88,  stage:"Round of 32", group:"—", home:"2D",      away:"2G",          utc:"2026-07-03T18:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},

  // ROUND OF 16 (IDs 93–100; R16 Wn = winner of match 92+n)
  {id:89,  stage:"Round of 16", group:"—", home:"R32 W2",  away:"R32 W5",  utc:"2026-07-04T21:00:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, USA"},
  {id:90,  stage:"Round of 16", group:"—", home:"R32 W1",  away:"R32 W3",  utc:"2026-07-04T17:00:00Z", venue:"NRG Stadium",             city:"Houston, USA"},
  {id:91,  stage:"Round of 16", group:"—", home:"R32 W4",  away:"R32 W6",  utc:"2026-07-05T20:00:00Z", venue:"MetLife Stadium",         city:"New York, USA"},
  {id:92,  stage:"Round of 16", group:"—", home:"R32 W7",  away:"R32 W8",  utc:"2026-07-06T00:00:00Z", venue:"Estadio Azteca",          city:"Mexico City, MEX"},
  {id:93,  stage:"Round of 16", group:"—", home:"R32 W11", away:"R32 W12", utc:"2026-07-06T19:00:00Z", venue:"AT&T Stadium",            city:"Dallas, USA"},
  {id:94,  stage:"Round of 16", group:"—", home:"R32 W9",  away:"R32 W10", utc:"2026-07-06T00:00:00Z", venue:"Lumen Field",             city:"Seattle, USA"},
  {id:95,  stage:"Round of 16", group:"—", home:"R32 W14", away:"R32 W16", utc:"2026-07-07T16:00:00Z", venue:"Mercedes-Benz Stadium",   city:"Atlanta, USA"},
  {id:96, stage:"Round of 16", group:"—", home:"R32 W13", away:"R32 W15", utc:"2026-07-07T20:00:00Z", venue:"BC Place",                city:"Vancouver, CAN"},

  // QUARTERFINALS (IDs 101–104; QF Wn = winner of match 100+n)
  {id:97, stage:"Quarterfinal", group:"—", home:"R16 W1", away:"R16 W2", utc:"2026-07-09T20:00:00Z", venue:"Gillette Stadium",  city:"Boston, USA"},
  {id:98, stage:"Quarterfinal", group:"—", home:"R16 W5", away:"R16 W6", utc:"2026-07-10T19:00:00Z", venue:"SoFi Stadium",      city:"Los Angeles, USA"},
  {id:99, stage:"Quarterfinal", group:"—", home:"R16 W3", away:"R16 W4", utc:"2026-07-11T21:00:00Z", venue:"Hard Rock Stadium", city:"Miami, USA"},
  {id:100, stage:"Quarterfinal", group:"—", home:"R16 W7", away:"R16 W8", utc:"2026-07-12T01:00:00Z", venue:"Arrowhead Stadium", city:"Kansas City, USA"},

  // SEMIFINALS (IDs 105–106)
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
    .map(t => `<a href="../${t.slug}/index.html" class="team-link">${t.flag} ${esc(t.name)}</a>`)
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
function generateTeamPage(team) {
  const teamMatches = MATCHES.filter(m =>
    (m.stage === 'Group Stage') &&
    (m.home === team.name || m.away === team.name)
  );

  const matchCount = teamMatches.length;
  const displayName = team.name;
  const flag = team.flag;
  const group = team.group;
  const slug = team.slug;

  // Build MATCHES JS array for page
  const matchesJs = teamMatches.map(m =>
    `  {id:${m.id}, utc:"${m.utc}"}`
  ).join(',\n');

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
        <article class="match-card" itemscope itemtype="https://schema.org/SportsEvent">
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
              <div class="vs-block"><span class="vs-text">VS</span></div>
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
<meta charset="UTF-8">
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
<style>
:root {
  --bg: #F5F0E8;
  --bg2: #EDE8DC;
  --ink: #1A1410;
  --ink2: #4A3F35;
  --muted: #8C7B6E;
  --gold: #C17F2A;
  --gold-light: #E8A84C;
  --grass: #2A6B3A;
  --red: #C0392B;
  --white: #FDFAF4;
  --border: rgba(26,20,16,0.12);
  --shadow: 0 2px 20px rgba(26,20,16,0.08);
}
* { margin:0; padding:0; box-sizing:border-box; }
body { background:var(--bg); color:var(--ink); font-family:'Instrument Sans',sans-serif; min-height:100vh; }
body::after {
  content:''; position:fixed; inset:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events:none; z-index:999; opacity:0.6;
}
.topnav { background:var(--ink); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.nav-logo { font-family:'Syne',sans-serif; font-weight:800; font-size:16px; color:var(--white); text-decoration:none; letter-spacing:1px; }
.nav-logo span { color:var(--gold-light); }
.nav-home { font-size:12px; color:rgba(253,250,244,0.5); text-decoration:none; border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:6px 12px; transition:all 0.2s; }
.nav-home:hover { color:var(--white); border-color:var(--gold); }
.hero { background:var(--ink); padding:40px 24px 32px; position:relative; overflow:hidden; }
.hero::before { content:''; position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.03) 39px,rgba(255,255,255,0.03) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.03) 39px,rgba(255,255,255,0.03) 40px); }
.hero-inner { max-width:1100px; margin:0 auto; position:relative; z-index:1; }
.breadcrumb { font-size:12px; color:rgba(253,250,244,0.35); margin-bottom:16px; }
.breadcrumb a { color:rgba(253,250,244,0.5); text-decoration:none; }
.breadcrumb a:hover { color:var(--gold-light); }
.hero-flag { font-size:52px; margin-bottom:12px; line-height:1; }
.hero h1 { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(28px,5vw,56px); line-height:1.0; color:var(--white); margin-bottom:10px; }
.hero h2 { font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--gold-light); margin-bottom:16px; opacity:0.9; }
.hero-body { font-size:15px; color:rgba(253,250,244,0.55); max-width:640px; line-height:1.75; margin-bottom:28px; }
.hero-stats { display:flex; gap:20px; flex-wrap:wrap; }
.stat-chip { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 16px; font-size:13px; color:rgba(253,250,244,0.7); }
.stat-chip strong { color:var(--gold-light); }
.main { max-width:1100px; margin:0 auto; padding:32px 24px 80px; }
.controls { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:28px; padding:16px 20px; background:var(--white); border:1px solid var(--border); border-radius:14px; box-shadow:var(--shadow); }
.tz-label { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--muted); white-space:nowrap; }
.select-wrap { position:relative; flex:1; min-width:180px; }
.select-wrap::after { content:'▾'; position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--gold); pointer-events:none; font-size:12px; }
select { width:100%; background:var(--bg2); border:1px solid var(--border); border-radius:8px; color:var(--ink); font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:500; padding:9px 32px 9px 12px; appearance:none; cursor:pointer; outline:none; transition:border-color 0.2s; }
select:focus { border-color:var(--gold); }
.now-badge { font-family:'Instrument Mono',monospace; font-size:12px; color:var(--grass); background:rgba(42,107,58,0.1); border:1px solid rgba(42,107,58,0.2); border-radius:8px; padding:7px 13px; white-space:nowrap; }
.section-label { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:var(--muted); margin-bottom:14px; display:flex; align-items:center; gap:12px; }
.section-label::after { content:''; flex:1; height:1px; background:var(--border); }
.matches-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:12px; margin-bottom:36px; }
.match-card { background:var(--white); border:1px solid var(--border); border-radius:14px; overflow:hidden; transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s; }
.match-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(26,20,16,0.12); border-color:rgba(193,127,42,0.3); }
.card-accent { height:3px; background:var(--gold); }
.card-body { padding:16px 18px 0; }
.card-meta { margin-bottom:8px; }
.group-tag { font-family:'Instrument Mono',monospace; font-size:10px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); }
.match-h3 { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:var(--ink2); margin-bottom:14px; line-height:1.3; }
.teams-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:16px; }
.team-side { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; }
.t-flag { font-size:28px; line-height:1; }
.t-name { font-size:11px; font-weight:600; text-align:center; color:var(--ink); line-height:1.3; }
.vs-block { display:flex; flex-direction:column; align-items:center; flex-shrink:0; }
.vs-text { font-family:'Syne',sans-serif; font-size:11px; font-weight:700; color:var(--muted); letter-spacing:3px; }
.time-strip { border-top:1px solid var(--border); padding:12px 18px; display:grid; grid-template-columns:1fr 1fr; gap:10px; background:var(--bg2); }
.ts-block .ts-label { font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin-bottom:3px; font-weight:600; }
.ts-block .ts-val { font-family:'Instrument Mono',monospace; font-size:13px; color:var(--ink); }
.ts-block.highlight .ts-val { font-size:16px; font-weight:700; color:var(--gold); }
.ts-block .venue-val { font-family:'Instrument Sans',sans-serif; font-size:11px; color:var(--ink2); }
.copy-match-btn { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:10px; background:transparent; border:none; border-top:1px solid var(--border); color:var(--muted); font-family:'Instrument Sans',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.5px; cursor:pointer; transition:all 0.18s; }
.copy-match-btn:hover { background:var(--bg); color:var(--ink); }
.other-teams { margin-top:48px; padding-top:32px; border-top:1px solid var(--border); }
.other-teams-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; margin-bottom:16px; }
.team-links { display:flex; flex-wrap:wrap; gap:8px; }
.team-link { display:inline-flex; align-items:center; gap:6px; background:var(--white); border:1px solid var(--border); border-radius:100px; padding:6px 14px; font-size:12px; font-weight:500; color:var(--ink2); text-decoration:none; transition:all 0.18s; white-space:nowrap; }
.team-link:hover { border-color:var(--gold); color:var(--gold); background:var(--bg); }
footer { text-align:center; padding:28px 24px; background:var(--ink); color:rgba(253,250,244,0.4); font-size:12px; line-height:1.8; }
footer a { color:var(--gold-light); text-decoration:none; }
footer strong { color:rgba(253,250,244,0.7); }
.toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px); background:var(--ink); color:var(--white); font-size:13px; font-weight:600; padding:12px 24px; border-radius:100px; z-index:9999; transition:transform 0.3s ease; pointer-events:none; }
.toast.show { transform:translateX(-50%) translateY(0); }
@media(max-width:600px) { .matches-grid { grid-template-columns:1fr; } .hero h1 { font-size:28px; } .controls { flex-direction:column; align-items:stretch; } }
img.emoji { height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em; display: inline-block; }
</style>
<script src="https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js" crossorigin="anonymous"></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>
</head>
<body>

<nav class="topnav">
  <a href="../index.html" class="nav-logo">myteam<span>kickoff</span>.com</a>
  <div style="display:flex;gap:8px;align-items:center;">
    <a href="../index.html" class="nav-home">← All Teams</a>
    <a href="/contact" class="nav-home">Contact</a>
  </div>
</nav>

<div class="hero">
  <div class="hero-inner">
    <div class="breadcrumb"><a href="../index.html">All Teams</a> / ${esc(displayName)}</div>
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

<div style="text-align:center;margin:28px auto;max-width:1100px;padding:0 24px;">
  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
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

<div style="text-align:center;margin:28px auto;max-width:1100px;padding:0 24px;">
  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
  <div class="other-teams">
    <div class="other-teams-title">See Another Team's Schedule</div>
    <div class="team-links">
${otherTeamsHtml(slug)}
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<div style="text-align:center;margin:28px auto;max-width:1100px;padding:0 24px;">
  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
<footer>
  <strong><a href="../index.html">myteamkickoff.com</a></strong> &middot; World Cup 2026 Kickoff Times in Your Timezone<br>
  🇺🇸 USA &middot; 🇨🇦 Canada &middot; 🇲🇽 Mexico &middot; June 11 – July 19, 2026<br>
  Times based on official FIFA schedule. All kickoffs converted from local venue time to UTC.<br>
  <a href="/privacy">Privacy Policy</a> &middot; <a href="/contact">Contact</a> &middot; &copy; 2026 myteamkickoff.com
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
</script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  twemoji.parse(document.body, {
    folder: 'svg', ext: '.svg',
    base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/'
  });
});
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
      ? `, homeScore:${sc.homeScore}, awayScore:${sc.awayScore}, status:${JSON.stringify(sc.status)}`
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

// ─── PATCH INDEX.HTML ─────────────────────────────────────────────────────────
function patchIndexHtml() {
  const indexPath = path.join(__dirname, '..', 'site', 'index.html');
  const resultsPath = path.join(__dirname, '..', 'site', 'results.json');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Load persisted match results — keyed by match id (as number)
  let scores = {};
  if (fs.existsSync(resultsPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      for (const [k, v] of Object.entries(raw)) {
        scores[Number(k)] = v;
      }
      console.log(`📊 Loaded ${Object.keys(scores).length} result(s) from results.json`);
    } catch (e) {
      console.warn('⚠️  Could not parse results.json — skipping score preservation:', e.message);
    }
  }

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
  for (let n = 1; n <= 16; n++) { const w = matchWinners[72+n]; if (w) resolvedTeams[\`R32 W\${n}\`] = w; }
  for (let n = 1; n <= 8;  n++) { const w = matchWinners[88+n]; if (w) resolvedTeams[\`R16 W\${n}\`] = w; }
  for (let n = 1; n <= 4;  n++) { const w = matchWinners[96+n]; if (w) resolvedTeams[\`QF W\${n}\`] = w; }
  if (matchWinners[101]) resolvedTeams['SF W1'] = matchWinners[101];
  if (matchWinners[102]) resolvedTeams['SF W2'] = matchWinners[102];
  if (matchLosers[101])  resolvedTeams['SF L1'] = matchLosers[101];
  if (matchLosers[102])  resolvedTeams['SF L2'] = matchLosers[102];
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

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Patched site/index.html');
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
function main() {
  const siteDir = path.join(__dirname, '..', 'site');

  // 1. Patch index.html
  patchIndexHtml();

  // 2. Remove obsolete team dirs
  for (const dir of DIRS_TO_REMOVE) {
    const p = path.join(siteDir, dir);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`🗑️  Removed site/${dir}/`);
    }
  }

  // 3. Generate / overwrite all 48 team pages
  for (const team of TEAMS) {
    const teamDir = path.join(siteDir, team.slug);
    if (!fs.existsSync(teamDir)) {
      fs.mkdirSync(teamDir, { recursive: true });
    }
    const html = generateTeamPage(team);
    fs.writeFileSync(path.join(teamDir, 'index.html'), html, 'utf8');
    console.log(`📄 Generated site/${team.slug}/index.html`);
  }

  console.log('\n✅ Done! All team pages generated and index.html patched.');
  console.log(`   Teams in draw: ${TEAMS.length}`);
  console.log(`   Matches total: ${MATCHES.length}`);
  console.log(`   Dirs removed:  ${DIRS_TO_REMOVE.join(', ')}`);
}

main();
