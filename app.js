const categories = [
  {
    name: "Groceries",
    color: "#116149",
    keywords: ["tesco", "sainsbury", "asda", "aldi", "lidl", "waitrose", "morrisons", "coop", "grocery", "supermarket"],
  },
  {
    name: "Dining",
    color: "#d0502d",
    keywords: ["deliveroo", "uber eats", "restaurant", "cafe", "coffee", "pret", "nero", "starbucks", "mcdonald", "kfc", "nando"],
  },
  {
    name: "Transport",
    color: "#245b8c",
    keywords: ["tfl", "uber", "bolt", "train", "rail", "bus", "petrol", "fuel", "shell", "bp"],
  },
  {
    name: "Housing",
    color: "#75563d",
    keywords: ["rent", "mortgage", "landlord", "rightmove", "letting"],
  },
  {
    name: "Bills",
    color: "#7b4b83",
    keywords: ["energy", "water", "utility", "octopus", "british gas", "vodafone", "ee", "o2", "three", "council tax", "insurance"],
  },
  {
    name: "Subscriptions",
    color: "#4a6d36",
    keywords: ["netflix", "spotify", "amazon prime", "prime video", "disney", "apple", "icloud", "youtube", "gym", "adobe"],
  },
  {
    name: "Shopping",
    color: "#96642f",
    keywords: ["amazon", "asos", "zara", "hm", "uniqlo", "ikea", "boots", "argos", "ebay", "etsy"],
  },
  {
    name: "Income",
    color: "#0f7a55",
    keywords: ["salary", "payroll", "wages", "income", "dividend", "refund"],
  },
  {
    name: "Transfers",
    color: "#6d7480",
    keywords: ["transfer", "monzo pot", "savings", "isa", "revolut", "wise"],
  },
  {
    name: "Other",
    color: "#8a8174",
    keywords: [],
  },
];

const sampleCsv = `Date,Description,Amount
2026-04-01,Salary ACME Ltd,3200.00
2026-04-01,Rent Standing Order,-1250.00
2026-04-02,Tesco Superstore,-84.32
2026-04-03,TFL Travel Charge,-8.10
2026-04-04,Deliveroo,-31.45
2026-04-05,Spotify,-10.99
2026-04-06,Octopus Energy,-116.00
2026-04-07,Pret A Manger,-7.80
2026-04-08,Sainsbury Local,-42.16
2026-04-10,Uber Trip,-18.70
2026-04-11,Amazon Marketplace,-63.25
2026-04-12,Netflix,-17.99
2026-04-13,Nando's,-28.40
2026-04-14,Monzo Pot Transfer,-300.00
2026-04-16,Aldi,-58.12
2026-04-18,Caffe Nero,-5.10
2026-04-20,ASOS,-72.50
2026-04-21,Vodafone,-38.00
2026-04-22,TFL Travel Charge,-9.20
2026-04-24,Uber Eats,-26.70
2026-04-28,Waitrose,-64.34
2026-05-01,Salary ACME Ltd,3200.00
2026-05-01,Rent Standing Order,-1250.00
2026-05-02,Tesco Express,-33.14
2026-05-02,TFL Travel Charge,-6.80`;

const state = {
  transactions: [],
  selectedMonth: "all",
  search: "",
};

const els = {
  csvFile: document.querySelector("#csvFile"),
  sampleBtn: document.querySelector("#sampleBtn"),
  fileStatus: document.querySelector("#fileStatus"),
  monthSelect: document.querySelector("#monthSelect"),
  categoryKey: document.querySelector("#categoryKey"),
  totalSpend: document.querySelector("#totalSpend"),
  totalSpendHint: document.querySelector("#totalSpendHint"),
  totalIncome: document.querySelector("#totalIncome"),
  incomeHint: document.querySelector("#incomeHint"),
  netCashflow: document.querySelector("#netCashflow"),
  cashflowHint: document.querySelector("#cashflowHint"),
  topCategory: document.querySelector("#topCategory"),
  topCategoryHint: document.querySelector("#topCategoryHint"),
  healthScore: document.querySelector("#healthScore"),
  breakdownChart: document.querySelector("#breakdownChart"),
  insightsList: document.querySelector("#insightsList"),
  searchInput: document.querySelector("#searchInput"),
  transactionsBody: document.querySelector("#transactionsBody"),
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function parseCsv(text) {
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

  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const dateIndex = findHeader(headers, ["date", "transactiondate", "created", "bookingdate"]);
  const descriptionIndex = findHeader(headers, ["description", "merchant", "name", "details", "reference", "narrative", "payee"]);
  const amountIndex = findHeader(headers, ["amount", "value", "transactionamount"]);
  const debitIndex = findHeader(headers, ["moneyout", "paidout", "debit", "withdrawal"]);
  const creditIndex = findHeader(headers, ["moneyin", "paidin", "credit", "deposit"]);

  return rows.slice(1).map((cells, index) => {
    const amount = readAmount(cells, amountIndex, debitIndex, creditIndex);
    const description = cells[descriptionIndex] || "Unknown transaction";
    const date = normaliseDate(cells[dateIndex]);
    const category = categorise(description, amount);

    return {
      id: `${date}-${index}-${description}`,
      date,
      description,
      amount: Number.isFinite(amount) ? amount : 0,
      category,
    };
  }).filter((transaction) => transaction.date && transaction.amount !== 0);
}

function findHeader(headers, candidates) {
  const exact = candidates.map((candidate) => headers.indexOf(candidate)).find((index) => index >= 0);
  if (exact >= 0) return exact;
  return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

function readAmount(cells, amountIndex, debitIndex, creditIndex) {
  if (amountIndex >= 0 && cells[amountIndex]) return parseMoney(cells[amountIndex]);

  const debit = debitIndex >= 0 ? Math.abs(parseMoney(cells[debitIndex])) : 0;
  const credit = creditIndex >= 0 ? Math.abs(parseMoney(cells[creditIndex])) : 0;
  if (credit) return credit;
  if (debit) return -debit;
  return 0;
}

function parseMoney(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const isParenthesised = text.startsWith("(") && text.endsWith(")");
  const amount = Number(text.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(amount)) return 0;
  return isParenthesised ? -Math.abs(amount) : amount;
}

function normaliseDate(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0, 10);
  return "";
}

function categorise(description, amount) {
  const text = description.toLowerCase();
  if (amount > 0) return categories.find((category) => category.name === "Income");

  return categories.find((category) => (
    category.name !== "Income" && category.keywords.some((keyword) => text.includes(keyword))
  )) || categories.find((category) => category.name === "Other");
}

function getVisibleTransactions() {
  return state.transactions
    .filter((transaction) => state.selectedMonth === "all" || monthKey(transaction.date) === state.selectedMonth)
    .filter((transaction) => {
      const query = state.search.trim().toLowerCase();
      if (!query) return true;
      return transaction.description.toLowerCase().includes(query) || transaction.category.name.toLowerCase().includes(query);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function monthKey(date) {
  return date.slice(0, 7);
}

function monthLabel(key) {
  if (key === "all") return "All months";
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function summarise(transactions) {
  const spendTransactions = transactions.filter((transaction) => transaction.amount < 0 && transaction.category.name !== "Transfers");
  const income = transactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
  const spend = spendTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const net = income - spend;
  const byCategory = new Map();

  spendTransactions.forEach((transaction) => {
    const current = byCategory.get(transaction.category.name) || {
      category: transaction.category,
      total: 0,
      count: 0,
    };
    current.total += Math.abs(transaction.amount);
    current.count += 1;
    byCategory.set(transaction.category.name, current);
  });

  return {
    spend,
    income,
    net,
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
  };
}

function generateInsights(summary, transactions) {
  if (!transactions.length) return [];

  const insights = [];
  const top = summary.byCategory[0];
  const dining = summary.byCategory.find((item) => item.category.name === "Dining");
  const subscriptions = summary.byCategory.find((item) => item.category.name === "Subscriptions");
  const transport = summary.byCategory.find((item) => item.category.name === "Transport");
  const recurringSmall = transactions.filter((transaction) => transaction.amount < 0 && Math.abs(transaction.amount) < 20).length;
  const incomeRatio = summary.income ? Math.round((summary.spend / summary.income) * 100) : 0;

  if (top) {
    insights.push({
      type: "warning",
      title: `${top.category.name} is the biggest spend area`,
      body: `${currency.format(top.total)} went to ${top.category.name.toLowerCase()}, which is ${Math.round((top.total / summary.spend) * 100)}% of tracked spending.`,
    });
  }

  if (dining && dining.total > summary.spend * 0.12) {
    insights.push({
      type: "opportunity",
      title: "Dining looks like a savings lever",
      body: `Reducing dining spend by 20% would free up about ${currency.format(dining.total * 0.2)} this period without touching fixed bills.`,
    });
  }

  if (subscriptions && subscriptions.count >= 2) {
    insights.push({
      type: "opportunity",
      title: "Subscription audit recommended",
      body: `${subscriptions.count} subscription-style payments total ${currency.format(subscriptions.total)}. Check whether each one is still earning its place.`,
    });
  }

  if (transport && transport.count >= 3) {
    insights.push({
      type: "pattern",
      title: "Frequent transport charges detected",
      body: `${transport.count} transport transactions suggest a recurring commute pattern. Weekly or monthly passes may be worth comparing.`,
    });
  }

  if (recurringSmall >= 5) {
    insights.push({
      type: "pattern",
      title: "Small purchases are adding texture",
      body: `${recurringSmall} transactions under ${currency.format(20)} show that everyday purchases are a meaningful behavioural pattern, not just noise.`,
    });
  }

  insights.push({
    type: summary.net >= 0 ? "pattern" : "warning",
    title: summary.net >= 0 ? "Cashflow is positive" : "Cashflow is negative",
    body: `${incomeRatio}% of detected income was spent. Net cashflow for this view is ${currency.format(summary.net)}.`,
  });

  return insights.slice(0, 5);
}

function render() {
  renderCategoryKey();
  renderMonths();

  const visible = getVisibleTransactions();
  const summary = summarise(visible);
  const top = summary.byCategory[0];

  els.totalSpend.textContent = currency.format(summary.spend);
  els.totalSpendHint.textContent = `${visible.filter((transaction) => transaction.amount < 0).length} outgoing transactions`;
  els.totalIncome.textContent = currency.format(summary.income);
  els.incomeHint.textContent = `${visible.filter((transaction) => transaction.amount > 0).length} income transactions`;
  els.netCashflow.textContent = currency.format(summary.net);
  els.cashflowHint.textContent = summary.net >= 0 ? "Money left after spend" : "Spend exceeded income";
  els.topCategory.textContent = top ? top.category.name : "--";
  els.topCategoryHint.textContent = top ? `${currency.format(top.total)} across ${top.count} payments` : "Largest spend area";
  els.healthScore.textContent = calculateHealthScore(summary);

  renderBreakdown(summary);
  renderInsights(generateInsights(summary, visible));
  renderTransactions(visible);
}

function calculateHealthScore(summary) {
  if (!summary.income && !summary.spend) return "--";
  const ratio = summary.income ? summary.spend / summary.income : 1.3;
  const score = Math.max(24, Math.min(96, Math.round(100 - ratio * 45 + (summary.net > 0 ? 10 : -8))));
  return `${score}`;
}

function renderMonths() {
  const months = Array.from(new Set(state.transactions.map((transaction) => monthKey(transaction.date)))).sort().reverse();
  const options = ["all", ...months];
  const currentValue = els.monthSelect.value || state.selectedMonth;

  els.monthSelect.innerHTML = options.map((option) => (
    `<option value="${option}">${monthLabel(option)}</option>`
  )).join("");

  state.selectedMonth = options.includes(currentValue) ? currentValue : "all";
  els.monthSelect.value = state.selectedMonth;
}

function renderCategoryKey() {
  els.categoryKey.innerHTML = categories
    .filter((category) => category.name !== "Income")
    .map((category) => `
      <div class="key-item">
        <span class="swatch" style="background:${category.color}"></span>
        <span>${category.name}</span>
      </div>
    `).join("");
}

function renderBreakdown(summary) {
  if (!summary.byCategory.length) {
    els.breakdownChart.className = "breakdown-chart empty-state";
    els.breakdownChart.textContent = "Load a CSV to see category spend.";
    return;
  }

  const max = summary.byCategory[0].total || 1;
  els.breakdownChart.className = "breakdown-chart";
  els.breakdownChart.innerHTML = summary.byCategory.map((item) => `
    <div class="bar-row">
      <span class="bar-label">${item.category.name}</span>
      <span class="bar-track">
        <span class="bar-fill" style="width:${Math.max(4, (item.total / max) * 100)}%; background:${item.category.color}"></span>
      </span>
      <span class="bar-value">${currency.format(item.total)}</span>
    </div>
  `).join("");
}

function renderInsights(insights) {
  if (!insights.length) {
    els.insightsList.className = "insights-list empty-state";
    els.insightsList.textContent = "Insights will appear after import.";
    return;
  }

  els.insightsList.className = "insights-list";
  els.insightsList.innerHTML = insights.map((insight) => `
    <article class="insight ${insight.type}">
      <strong>${insight.title}</strong>
      <p>${insight.body}</p>
    </article>
  `).join("");
}

function renderTransactions(transactions) {
  if (!transactions.length) {
    els.transactionsBody.innerHTML = `<tr><td colspan="4" class="empty-row">No matching transactions.</td></tr>`;
    return;
  }

  els.transactionsBody.innerHTML = transactions.map((transaction) => `
    <tr>
      <td>${new Date(transaction.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
      <td>${escapeHtml(transaction.description)}</td>
      <td><span class="category-pill" style="color:${transaction.category.color}">${transaction.category.name}</span></td>
      <td class="amount-col ${transaction.amount < 0 ? "amount-negative" : "amount-positive"}">${currency.format(transaction.amount)}</td>
    </tr>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadCsv(text, sourceName) {
  const transactions = parseCsv(text);
  state.transactions = transactions;
  state.selectedMonth = "all";
  els.searchInput.value = "";
  state.search = "";
  els.fileStatus.textContent = transactions.length
    ? `${transactions.length} transactions loaded from ${sourceName}.`
    : `No transactions found in ${sourceName}.`;
  render();
}

els.csvFile.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  loadCsv(await file.text(), file.name);
});

els.sampleBtn.addEventListener("click", () => loadCsv(sampleCsv, "sample data"));

els.monthSelect.addEventListener("change", (event) => {
  state.selectedMonth = event.target.value;
  render();
});

els.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

render();
