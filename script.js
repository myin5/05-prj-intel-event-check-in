
const MAX_ATTENDEES = 50;

const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const attendeeCountEl = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const greeting = document.getElementById("greeting");


const waterCountEl = document.getElementById("waterCount");
const zeroCountEl = document.getElementById("zeroCount");
const powerCountEl = document.getElementById("powerCount");

const teamCards = {
  water: document.querySelector(".team-card.water"),
  zero:  document.querySelector(".team-card.zero"),
  power: document.querySelector(".team-card.power"),
};

const TEAM_LABELS = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables",
};

const VALID_TEAMS = new Set(["water", "zero", "power"]);


let total = 0;
const teamTotals = { water: 0, zero: 0, power: 0 };
let attendees = [];

const STORAGE_KEY = "summitCheckinState_v1";

function hydrateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.total === "number") total = data.total;
    if (data.teams && typeof data.teams === "object") {
      teamTotals.water = Number(data.teams.water) || 0;
      teamTotals.zero  = Number(data.teams.zero)  || 0;
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
  zeroCountEl.textContent  = String(teamTotals.zero);
  powerCountEl.textContent = String(teamTotals.power);
}

function renderProgress() {
  const pct = Math.min((total / MAX_ATTENDEES) * 100, 100);
  progressBar.style.width = `${pct}%`;

 
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", String(MAX_ATTENDEES));
  progressBar.setAttribute("aria-valuenow", String(total));
  progressBar.setAttribute("aria-label", `Attendance progress ${Math.round(pct)}%`);
}

function applyWinnerHighlight(leaders) {
  
  Object.values(teamCards).forEach(card => card.classList.remove('is-winner'));


  const labelToKey = {
    "Team Water Wise": "water",
    "Team Net Zero": "zero",
    "Team Renewables": "power",
  };

  leaders.forEach(label => {
    const key = labelToKey[label];
    const card = teamCards[key];
    if (card) card.classList.add('is-winner');
  });
}


function makeTeamListSection(cardEl) {
  const section = document.createElement("div");
  section.className = "attendee-sublist";
  section.innerHTML = `
    <div class="sublist-divider"></div>
    <h4 class="sublist-title">Members</h4>
    <div class="list"></div>
  `;
  cardEl.appendChild(section);
  return section.querySelector(".list");
}

const teamLists = {
  water: makeTeamListSection(teamCards.water),
  zero:  makeTeamListSection(teamCards.zero),
  power: makeTeamListSection(teamCards.power),
};

function makeRow(name, team) {
  const row = document.createElement("div");
  row.className = "member-row";

  const nameEl = document.createElement("span");
  nameEl.className = "member-name";
  nameEl.textContent = name;

  const badge = document.createElement("span");
  const badgeTeam = VALID_TEAMS.has(team) ? team : "unknown";
  badge.className = `team-badge team-badge--${badgeTeam}`;
  badge.textContent = TEAM_LABELS[team] ?? "Unknown Team";

  row.append(nameEl, badge);
  return row;
}

function renderTeamLists() {
  Object.values(teamLists).forEach((el) => (el.innerHTML = ""));

  attendees.forEach(({ name, team }) => {
    const listEl = teamLists[team];
    if (listEl) listEl.appendChild(makeRow(name, team));
  });

  Object.entries(teamLists).forEach(([team, listEl]) => {
    if (!listEl.children.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No attendees yet";
      listEl.appendChild(empty);
    }
  });
}

function showSuccessMessage(name, teamValue) {
  const teamLabel = TEAM_LABELS[teamValue] ?? "your team";
  greeting.textContent = `Welcome, ${name}! You're checked in with ${teamLabel}.`;
  greeting.classList.add("success-message");
  greeting.classList.remove("is-hidden");
}


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
  greeting.classList.remove("is-hidden");

  applyWinnerHighlight(leaders);
}


function enforceCapacityIfFull() {
  if (total >= MAX_ATTENDEES) {
    nameInput.disabled = true;
    teamSelect.disabled = true;
    const btn = form.querySelector("button[type='submit']");
    if (btn) btn.disabled = true;
  }
}


form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (total >= MAX_ATTENDEES) return; 

  const name = (nameInput.value || "").trim();
  const teamValue = teamSelect.value;

  if (!name || !teamValue || !VALID_TEAMS.has(teamValue)) return;

  total += 1;
  teamTotals[teamValue] += 1;

  attendees.push({ name, team: teamValue });
  saveToStorage();

  renderCounts();
  renderProgress();
  renderTeamLists();
  showSuccessMessage(name, teamValue);

  if (total >= MAX_ATTENDEES) {
    celebrateIfGoalReached();
    enforceCapacityIfFull();
  }

  form.reset();
  nameInput.focus();
});


hydrateFromStorage();
renderCounts();
renderProgress();
renderTeamLists();
celebrateIfGoalReached();
enforceCapacityIfFull();
