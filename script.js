const MAX_ATTENDEES = 50;

const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const attendeeCountEl = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const greeting = document.getElementById("greeting");

// Team counters on page
const waterCountEl = document.getElementById("waterCount");
const zeroCountEl = document.getElementById("zeroCount");
const powerCountEl = document.getElementById("powerCount");

const teamCards = {
  water: document.querySelector(".team-card.water"),
  zero:  document.querySelector(".team-card.zero"),
  power: document.querySelector(".team-card.power"),
};

function makeTeamListSection(cardEl) {
  const section = document.createElement("div");
  section.className = "attendee-sublist";
  section.style.marginTop = "8px";
  section.innerHTML = `
    <div style="height:1px;background:#e2e8f0;margin:6px 0 8px;"></div>
    <h4 style="color:#64748b;font-size:13px;margin-bottom:6px;">Members</h4>
    <div class="list" style="display:flex;flex-direction:column;gap:8px;"></div>
  `;
  cardEl.appendChild(section);
  return section.querySelector(".list");
}

const teamLists = {
  water: makeTeamListSection(teamCards.water),
  zero:  makeTeamListSection(teamCards.zero),
  power: makeTeamListSection(teamCards.power),
};

const TEAM_LABELS = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables",
};

let total = 0; // 3) counter that increments each submission
const teamTotals = { water: 0, zero: 0, power: 0 };

const STORAGE_KEY = "summitCheckinState_v1";
let attendees = [];
function hydrateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.total === "number") total = data.total;
    if (data.teams && typeof data.teams === "object") {
      teamTotals.water = Number(data.teams.water) || 0;
      teamTotals.zero = Number(data.teams.zero) || 0;
      teamTotals.power = Number(data.teams.power) || 0;
    }
    if (Array.isArray(data.attendees)) attendees = data.attendees;
  } catch {}
}

function saveToStorage() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ total, teams: teamTotals, attendees })
  );
}
function renderCounts() {
  attendeeCountEl.textContent = String(total);

  waterCountEl.textContent = String(teamTotals.water);
  zeroCountEl.textContent = String(teamTotals.zero);
  powerCountEl.textContent = String(teamTotals.power);
}

function renderProgress() {
  const pct = Math.min((total / MAX_ATTENDEES) * 100, 100);

  progressBar.style.width = `${pct}%`;
  progressBar.setAttribute(
    "aria-label",
    `Attendance progress ${Math.round(pct)}%`
  );
}

function renderTeamLists() {
  Object.values(teamLists).forEach((el) => (el.innerHTML = ""));

  const makeRow = (name, team) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.padding = "8px 10px";
    row.style.background = "white";
    row.style.border = "2px solid rgba(0,0,0,0.05)";
    row.style.borderRadius = "10px";
    row.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)";

    const nameEl = document.createElement("span");
    nameEl.textContent = name;
    nameEl.style.fontWeight = "600";
    nameEl.style.color = "#0f172a";

    const badge = document.createElement("span");
    badge.textContent = TEAM_LABELS[team] ?? "Unknown Team";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "600";
    badge.style.padding = "4px 10px";
    badge.style.borderRadius = "999px";

    if (team === "water") { badge.style.background = "#e8f7fc"; badge.style.color = "#075985"; badge.style.border = "1px solid #bae6fd"; }
    else if (team === "zero") { badge.style.background = "#ecfdf3"; badge.style.color = "#065f46"; badge.style.border = "1px solid #bbf7d0"; }
    else if (team === "power") { badge.style.background = "#fff7ed"; badge.style.color = "#9a3412"; badge.style.border = "1px solid #fed7aa"; }
    else { badge.style.background = "#f1f5f9"; badge.style.color = "#475569"; badge.style.border = "1px solid #e2e8f0"; }

    row.appendChild(nameEl);
    row.appendChild(badge);
    return row;
  };

  attendees.forEach(({ name, team }) => {
    const listEl = teamLists[team];
    if (listEl) listEl.appendChild(makeRow(name, team));
  });

  Object.entries(teamLists).forEach(([team, listEl]) => {
    if (!listEl.children.length) {
      const empty = document.createElement("div");
      empty.textContent = "No attendees yet";
      empty.style.color = "#64748b";
      empty.style.fontSize = "12px";
      listEl.appendChild(empty);
    }
  });
}

function showSuccessMessage(name, teamValue) {
  const teamLabel = TEAM_LABELS[teamValue] ?? "your team";

  greeting.textContent = `Welcome, ${name}! You're checked in with ${teamLabel}.`;
  greeting.classList.add("success-message");
  greeting.style.display = "block";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = (nameInput.value || "").trim();
  const teamValue = teamSelect.value;

  if (!name || !teamValue) return;
  total += 1;

  if (teamTotals[teamValue] != null) {
    teamTotals[teamValue] += 1;
  }

  attendees.push({ name, team: teamValue });
  saveToStorage();

  renderCounts();
  renderProgress();
  renderTeamLists();

  showSuccessMessage(name, teamValue);

  if (total >= MAX_ATTENDEES) {
    celebrateIfGoalReached();
    nameInput.disabled = true;
    teamSelect.disabled = true;
    form.querySelector("button[type='submit']").disabled = true;
  }

  form.reset();
  nameInput.focus();
});

function getWinningTeam() {
  const { water, zero, power } = teamTotals;
  const max = Math.max(water, zero, power);
  const leaders = [];
  if (water === max) leaders.push("Team Water Wise");
  if (zero === max) leaders.push("Team Net Zero");
  if (power === max) leaders.push("Team Renewables");
  return leaders;
}

function celebrateIfGoalReached() {
  if (total < MAX_ATTENDEES) return;
  const leaders = getWinningTeam();
  const msg =
    leaders.length === 1
      ? `🎉 Goal reached! ${leaders[0]} leads the pack.`
      : `🎉 Goal reached! It's a tie between ${leaders.join(" & ")}.`;

  greeting.textContent = msg;
  greeting.classList.add("success-message");
  greeting.style.display = "block";
}

hydrateFromStorage();   
renderCounts();
renderProgress();
renderTeamLists();   
celebrateIfGoalReached(); 
