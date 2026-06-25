'use strict';
const fs   = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'site');

const TEAMS = [
  { name:"Mexico",         group:"A", slug:"mexico" },
  { name:"South Africa",   group:"A", slug:"south-africa" },
  { name:"South Korea",    group:"A", slug:"south-korea" },
  { name:"Czechia",        group:"A", slug:"czechia" },
  { name:"Canada",         group:"B", slug:"canada" },
  { name:"Bosnia & Herz.", group:"B", slug:"bosnia" },
  { name:"Qatar",          group:"B", slug:"qatar" },
  { name:"Switzerland",    group:"B", slug:"switzerland" },
  { name:"Brazil",         group:"C", slug:"brazil" },
  { name:"Morocco",        group:"C", slug:"morocco" },
  { name:"Haiti",          group:"C", slug:"haiti" },
  { name:"Scotland",       group:"C", slug:"scotland" },
  { name:"USA",            group:"D", slug:"usa" },
  { name:"Paraguay",       group:"D", slug:"paraguay" },
  { name:"Australia",      group:"D", slug:"australia" },
  { name:"Türkiye",        group:"D", slug:"turkiye" },
  { name:"Germany",        group:"E", slug:"germany" },
  { name:"Curaçao",        group:"E", slug:"curacao" },
  { name:"Côte d'Ivoire",  group:"E", slug:"cote-divoire" },
  { name:"Ecuador",        group:"E", slug:"ecuador" },
  { name:"Netherlands",    group:"F", slug:"netherlands" },
  { name:"Japan",          group:"F", slug:"japan" },
  { name:"Sweden",         group:"F", slug:"sweden" },
  { name:"Tunisia",        group:"F", slug:"tunisia" },
  { name:"Belgium",        group:"G", slug:"belgium" },
  { name:"Egypt",          group:"G", slug:"egypt" },
  { name:"Iran",           group:"G", slug:"iran" },
  { name:"New Zealand",    group:"G", slug:"new-zealand" },
  { name:"Spain",          group:"H", slug:"spain" },
  { name:"Uruguay",        group:"H", slug:"uruguay" },
  { name:"Cape Verde",     group:"H", slug:"cape-verde" },
  { name:"Saudi Arabia",   group:"H", slug:"saudi-arabia" },
  { name:"France",         group:"I", slug:"france" },
  { name:"Norway",         group:"I", slug:"norway" },
  { name:"Senegal",        group:"I", slug:"senegal" },
  { name:"Iraq",           group:"I", slug:"iraq" },
  { name:"Argentina",      group:"J", slug:"argentina" },
  { name:"Austria",        group:"J", slug:"austria" },
  { name:"Algeria",        group:"J", slug:"algeria" },
  { name:"Jordan",         group:"J", slug:"jordan" },
  { name:"Colombia",       group:"K", slug:"colombia" },
  { name:"Portugal",       group:"K", slug:"portugal" },
  { name:"DR Congo",       group:"K", slug:"dr-congo" },
  { name:"Uzbekistan",     group:"K", slug:"uzbekistan" },
  { name:"England",        group:"L", slug:"england" },
  { name:"Ghana",          group:"L", slug:"ghana" },
  { name:"Croatia",        group:"L", slug:"croatia" },
  { name:"Panama",         group:"L", slug:"panama" },
];

const STANDINGS_MARKER = '// ─── STANDINGS (embedded at build time) ──────────────────────────';

function buildStandingsSection(team) {
  const htmlSection = `
  <div style="border-top:1px solid var(--border);margin:32px 0;"></div>
  <div class="section-label">Group ${team.group} Standings</div>
  <div style="max-width:520px;overflow-x:auto;margin-bottom:24px;padding:0 4px;">
    <table style="width:100%;border-collapse:collapse;font-family:'Instrument Sans',sans-serif;font-size:14px;" id="groupStandingsTable">
      <thead>
        <tr style="background:var(--bg2,#f5f5f5);border-bottom:2px solid var(--border);">
          <th style="padding:7px 8px;text-align:left;font-weight:600;color:var(--ink2);">#</th>
          <th style="padding:7px 8px;text-align:left;font-weight:600;color:var(--ink2);">Team</th>
          <th style="padding:7px 8px;text-align:center;font-weight:600;color:var(--ink2);">Pld</th>
          <th style="padding:7px 8px;text-align:center;font-weight:600;color:var(--ink2);">Pts</th>
          <th style="padding:7px 8px;text-align:center;font-weight:600;color:var(--ink2);">GD</th>
          <th style="padding:7px 8px;text-align:center;font-weight:600;color:var(--ink2);">GF</th>
        </tr>
      </thead>
      <tbody id="groupStandingsTbody">
        <tr><td colspan="6" style="padding:8px;text-align:center;color:var(--ink3);">—</td></tr>
      </tbody>
    </table>
  </div>`;

  const jsSection = `
// ─── GROUP STANDINGS TABLE ────────────────────────────────────────
// ─── STANDINGS (embedded at build time) ──────────────────────────
const STANDINGS = {};
const TEAM_GROUP = "${team.group}";
const TEAM_NAME  = ${JSON.stringify(team.name)};

function renderGroupStandingsTable(entries) {
  const tbody = document.getElementById('groupStandingsTbody');
  if (!tbody || !Array.isArray(entries) || entries.length === 0) return;
  tbody.innerHTML = entries.map(function(e, i) {
    const isSelf = e.team === TEAM_NAME;
    const rowStyle = isSelf
      ? ' style="font-weight:700;background:rgba(0,0,0,.04);"'
      : ' style="border-top:1px solid var(--border);"';
    const gdSign = e.gd > 0 ? '+' : '';
    return '<tr' + rowStyle + '>'
      + '<td style="padding:6px 8px;">' + (i + 1) + '</td>'
      + '<td style="padding:6px 8px;">' + e.team + '</td>'
      + '<td style="padding:6px 8px;text-align:center;">' + e.played + '</td>'
      + '<td style="padding:6px 8px;text-align:center;font-weight:700;">' + e.points + '</td>'
      + '<td style="padding:6px 8px;text-align:center;">' + gdSign + e.gd + '</td>'
      + '<td style="padding:6px 8px;text-align:center;">' + e.gf + '</td>'
      + '</tr>';
  }).join('');
}

(function initGroupStandings() {
  const entries = STANDINGS[TEAM_GROUP];
  if (entries) renderGroupStandingsTable(entries);
  fetch('/api/standings').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (d && d.groups && d.groups[TEAM_GROUP]) renderGroupStandingsTable(d.groups[TEAM_GROUP]);
  }).catch(function(){});
})();`;

  return { htmlSection, jsSection };
}

let patched = 0;
let skipped = 0;
let alreadyDone = 0;

for (const team of TEAMS) {
  const filePath = path.join(SITE_DIR, team.slug, 'index.html');

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Not found: ${filePath}`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes(STANDINGS_MARKER)) {
    console.log(`✓  Already has standings marker: ${team.slug}`);
    alreadyDone++;
    continue;
  }

  const { htmlSection, jsSection } = buildStandingsSection(team);

  if (!html.includes('<div class="other-teams">')) {
    console.warn(`⚠️  Could not find injection point (other-teams) in: ${team.slug}`);
    skipped++;
    continue;
  }

  if (!html.includes('setInterval(fetchLiveData, 60000);')) {
    console.warn(`⚠️  Could not find JS injection point (fetchLiveData) in: ${team.slug}`);
    skipped++;
    continue;
  }

  html = html.replace(
    '<div class="other-teams">',
    htmlSection + '\n\n  <div class="other-teams">'
  );

  html = html.replace(
    'setInterval(fetchLiveData, 60000);\n</script>',
    'setInterval(fetchLiveData, 60000);\n' + jsSection + '\n</script>'
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅  Injected standings into: ${team.slug} (Group ${team.group})`);
  patched++;
}

console.log(`\nDone: ${patched} patched, ${alreadyDone} already done, ${skipped} skipped.`);
