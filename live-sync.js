(function () {
  if (window.__financeLiveSyncIntegrated) return;

  const configKey = "financeAnalyst.liveConfig.v1";
  const lastSyncKey = "financeAnalyst.lastSheetSync.v1";
  const manualKey = "financeAnalyst.manualTransactions.v1";

  const els = {
    form: document.querySelector("#entryForm"),
    date: document.querySelector("#entryDate"),
    description: document.querySelector("#entryDescription"),
    type: document.querySelector("#entryType"),
    amount: document.querySelector("#entryAmount"),
    writeUrl: document.querySelector("#sheetWriteUrl"),
    readUrl: document.querySelector("#sheetReadUrl"),
    refreshHours: document.querySelector("#refreshHours"),
    save: document.querySelector("#saveLiveBtn"),
    sync: document.querySelector("#syncNowBtn"),
    status: document.querySelector("#syncStatus"),
  };

  const state = {
    writeUrl: "",
    readUrl: "",
    refreshHours: 24,
  };

  function loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(configKey) || "{}");
      state.writeUrl = saved.writeUrl || "";
      state.readUrl = saved.readUrl || "";
      state.refreshHours = Number(saved.refreshHours) || 24;
    } catch {
      state.writeUrl = "";
      state.readUrl = "";
      state.refreshHours = 24;
    }

    if (els.writeUrl) els.writeUrl.value = state.writeUrl;
    if (els.readUrl) els.readUrl.value = state.readUrl;
    if (els.refreshHours) els.refreshHours.value = String(state.refreshHours);
    setStatus();
  }

  function saveConfig() {
    state.writeUrl = els.writeUrl.value.trim();
    state.readUrl = els.readUrl.value.trim();
    state.refreshHours = Number(els.refreshHours.value) || 24;
    localStorage.setItem(configKey, JSON.stringify(state));
    setStatus("Live spreadsheet settings saved.");
    syncNow();
  }

  function setStatus(message) {
    if (!els.status) return;
    if (message) {
      els.status.textContent = message;
      return;
    }
    if (!state.writeUrl && !state.readUrl) {
      els.status.textContent = "Live spreadsheet sync is not configured yet.";
      return;
    }
    const lastSync = Number(localStorage.getItem(lastSyncKey) || 0);
    const lastText = lastSync ? new Date(lastSync).toLocaleString("en-GB") : "never";
    els.status.textContent = `Live sync configured. Last pull: ${lastText}.`;
  }

  function captureEntry() {
    if (!state.writeUrl) return;
    const amount = Number(els.amount.value);
    if (!els.date.value || !els.description.value.trim() || !Number.isFinite(amount) || amount <= 0) return;

    const signedAmount = els.type.value === "income" ? amount : -amount;
    postToSheet({
      id: `live-${Date.now()}`,
      date: els.date.value,
      description: els.description.value.trim(),
      category: "",
      amount: signedAmount.toFixed(2),
      source: "sheet",
    });
  }

  function postToSheet(transaction) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = state.writeUrl;
    form.target = "sheetSubmitFrame";
    form.hidden = true;

    Object.entries(transaction).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.append(input);
    });

    document.body.append(form);
    form.submit();
    form.remove();
    setStatus("Entry sent to spreadsheet. It will appear after the next pull.");
  }

  async function syncNow() {
    if (!state.readUrl) {
      setStatus("Add a spreadsheet read URL before syncing.");
      return;
    }

    try {
      setStatus("Pulling latest spreadsheet transactions...");
      const response = await fetch(addCacheBuster(state.readUrl));
      if (!response.ok) throw new Error(`Spreadsheet returned ${response.status}`);
      const sourceCsv = await response.text();
      const trackerCsv = sheetCsvToTrackerCsv(sourceCsv);
      localStorage.setItem(manualKey, "[]");
      if (typeof loadManualTransactions === "function") loadManualTransactions();
      if (typeof loadCsv === "function") loadCsv(trackerCsv, "live spreadsheet");
      localStorage.setItem(lastSyncKey, String(Date.now()));
      setStatus();
    } catch (error) {
      setStatus(`Spreadsheet pull failed: ${error.message}`);
    }
  }

  function sheetCsvToTrackerCsv(csv) {
    const rows = parseCsvRows(csv);
    if (rows.length < 2) return "Date,Description,Amount\n";
    const headers = rows[0].map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const dateIndex = findHeader(headers, ["date"]);
    const descriptionIndex = findHeader(headers, ["description"]);
    const amountIndex = findHeader(headers, ["amount"]);
    const mapped = rows.slice(1).map((row) => [
      row[dateIndex] || "",
      row[descriptionIndex] || "",
      row[amountIndex] || "0",
    ]);
    return [["Date", "Description", "Amount"], ...mapped].map((row) => row.map(csvCell).join(",")).join("\n");
  }

  function parseCsvRows(text) {
    const rows = [];
    let field = "";
    let row = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(field.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  function findHeader(headers, candidates) {
    return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
  }

  function csvCell(value) {
    const text = String(value ?? "");
    if (!/[",\n\r]/.test(text.replace("\u001f", "")) && !/[",\n\r]/.test(text)) return text;
    return `"${text.replaceAll('"', '""')}"`;
  }

  function addCacheBuster(url) {
    return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
  }

  function syncIfDue() {
    const lastSync = Number(localStorage.getItem(lastSyncKey) || 0);
    const intervalMs = state.refreshHours * 60 * 60 * 1000;
    if (state.readUrl && (!lastSync || Date.now() - lastSync >= intervalMs)) syncNow();
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .live-config { margin-bottom: 24px; }
      .live-config input { width: 100%; min-height: 42px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--ink); padding: 0 12px; }
      .live-config label { margin-top: 12px; }
      .live-actions { display: flex; gap: 8px; margin-top: 12px; }
      @media (max-width: 720px) { .live-actions { display: grid; } }
    `;
    document.head.append(style);
  }

  if (!els.form) return;
  injectStyles();
  loadConfig();
  els.form.addEventListener("submit", captureEntry, true);
  els.save.addEventListener("click", saveConfig);
  els.sync.addEventListener("click", syncNow);
  setInterval(syncIfDue, 60 * 1000);
  syncIfDue();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
