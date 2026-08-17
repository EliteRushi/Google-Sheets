/* ============================================================
   CONFIGURATION
   Paste your deployed Google Apps Script Web App URL below.
   It looks like: https://script.google.com/macros/s/AKfycb..../exec
   This is the ONLY value you need to change.
   ============================================================ */
const API_URL = "https://docs.google.com/spreadsheets/d/1yagXN_W4QJ9nnwZs1CLi8FRYPZkt5Pt_UCIAaZh8WBc/edit?gid=1745375155#gid=1745375155";

/* Refresh interval: 2 minutes (120000 ms) */
const REFRESH_MS = 120000;

/* ---------- DOM ---------- */
const el = {
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  empty: document.getElementById("empty"),
  tableWrap: document.getElementById("tableWrap"),
  table: document.getElementById("dataTable"),
  scrollHint: document.getElementById("scrollHint"),
  notice: document.getElementById("notice"),
  lastUpdated: document.getElementById("lastUpdated"),
  lastChecked: document.getElementById("lastChecked"),
  liveBadge: document.getElementById("liveBadge"),
};

let hasData = false;
let lastSignature = "";

/* ---------- helpers ---------- */
function formatDateTime(value) {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function show(node, visible) {
  if (node) node.hidden = !visible;
}

function setNotice(message) {
  if (!message) {
    show(el.notice, false);
    el.notice.textContent = "";
    el.liveBadge.classList.remove("stale");
    el.liveBadge.innerHTML = "<i></i> Live";
    return;
  }
  el.notice.textContent = message;
  show(el.notice, true);
  el.liveBadge.classList.add("stale");
  el.liveBadge.innerHTML = "<i></i> Retrying";
}

/* ---------- rendering ---------- */
function renderTable(headers, rows) {
  const thead = el.table.tHead;
  const tbody = el.table.tBodies[0];
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const headRow = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    for (let i = 0; i < headers.length; i++) {
      const td = document.createElement("td");
      const cell = row[i];
      td.textContent = cell === undefined || cell === null ? "" : String(cell);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });

  show(el.loading, false);
  show(el.error, false);
  show(el.empty, rows.length === 0);
  show(el.tableWrap, rows.length > 0);
  show(el.scrollHint, rows.length > 0 && headers.length > 5);
}

/* ---------- data loading ---------- */
async function loadData() {
  const checkedAt = new Date();

  if (!API_URL || API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
    show(el.loading, false);
    show(el.error, true);
    el.error.innerHTML =
      "Configuration needed.<br /><span>Paste your Apps Script Web App URL into <code>API_URL</code> in script.js.</span>";
    el.lastChecked.textContent = "Last checked: " + formatTime(checkedAt);
    return;
  }

  try {
    const res = await fetch(API_URL + (API_URL.includes("?") ? "&" : "?") + "t=" + Date.now(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    if (!data || data.success === false) {
      throw new Error((data && data.error) || "API reported a failure");
    }

    const headers = Array.isArray(data.headers) ? data.headers : [];
    const rows = Array.isArray(data.rows) ? data.rows : [];

    const signature = JSON.stringify([headers, rows]);
    if (signature !== lastSignature) {
      lastSignature = signature;
      renderTable(headers, rows);
    } else {
      show(el.loading, false);
    }

    hasData = true;
    setNotice("");
    el.lastUpdated.textContent = "Last updated: " + formatDateTime(data.lastUpdated);
    el.lastChecked.textContent = "Last checked: " + formatTime(checkedAt);
  } catch (err) {
    console.error("Data load failed:", err);
    el.lastChecked.textContent = "Last checked: " + formatTime(checkedAt);

    if (hasData) {
      // Keep the previous valid table on screen, just warn.
      setNotice("Latest refresh failed - showing the last data we received. Retrying in 2 minutes.");
    } else {
      show(el.loading, false);
      show(el.tableWrap, false);
      show(el.scrollHint, false);
      show(el.error, true);
    }
  }
}

/* Immediate first load, then every 2 minutes. */
loadData();
setInterval(loadData, REFRESH_MS);
