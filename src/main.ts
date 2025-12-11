import { FinancialData } from './types';
import { calculateMetrics, formatINR } from './metrics';
import {
  createKeyMetricsChart,
  createHealthScorecardChart,
  createProfitLossChart,
  createAssetCompositionChart,
  createLiabilityCompositionChart,
  createLiquidityChart,
  createWorkingCapitalChart,
  generateKeyMetricsInsights,
  generateHealthScorecardInsights,
  generateProfitLossInsights,
  generateAssetCompositionInsights,
  generateLiabilityCompositionInsights,
  generateLiquidityInsights,
  generateWorkingCapitalInsights,
} from './charts';
import { Metrics } from './types';

// LocalStorage keys
const LAST_SELECTED_KEY = 'redflag_last_selected';

// Global state
let currentData: FinancialData | null = null;
let currentMetrics: Metrics | null = null;
let cogsPercentage = 85; // Default COGS percentage
let availableCompanies: { name: string; source: 'public' | 'local' }[] = [];

// DOM elements
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
const exportReportBtn = document.getElementById(
  'export-report'
) as HTMLButtonElement;
const errorMessage = document.getElementById('error-message') as HTMLDivElement;
const chartsContainer = document.getElementById(
  'charts-container'
) as HTMLDivElement;
const companySelector = document.getElementById(
  'company-selector'
) as HTMLSelectElement;

// Risk dashboard elements
const riskScoreValue = document.getElementById(
  'risk-score-value'
) as HTMLDivElement;
const riskScoreLabel = document.getElementById(
  'risk-score-label'
) as HTMLDivElement;
const alertsList = document.getElementById('alerts-list') as HTMLDivElement;

// Key metrics elements
const metricRevenue = document.getElementById(
  'metric-revenue'
) as HTMLDivElement;
const metricProfit = document.getElementById('metric-profit') as HTMLDivElement;
const metricMargin = document.getElementById('metric-margin') as HTMLDivElement;
const metricCurrentRatio = document.getElementById(
  'metric-current-ratio'
) as HTMLDivElement;
const metricDebtEquity = document.getElementById(
  'metric-debt-equity'
) as HTMLDivElement;
const metricCash = document.getElementById('metric-cash') as HTMLDivElement;

// Company display elements
const companyMetaContainer = document.getElementById(
  'company-meta-container'
) as HTMLDivElement;

// Modal elements
const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
const modalCloseBtn = document.getElementById(
  'modal-close-btn'
) as HTMLButtonElement;
const modalCancelBtn = document.getElementById(
  'modal-cancel-btn'
) as HTMLButtonElement;
const modalSaveBtn = document.getElementById(
  'modal-save-btn'
) as HTMLButtonElement;
const modalFileInput = document.getElementById(
  'modal-file-input'
) as HTMLInputElement;

// Modal form inputs - Revenue & Cost
const modalRevenue = document.getElementById(
  'modal-revenue'
) as HTMLInputElement;
const modalOtherIncome = document.getElementById(
  'modal-other-income'
) as HTMLInputElement;
const modalCogs = document.getElementById('modal-cogs') as HTMLInputElement;
const modalGrossProfit = document.getElementById(
  'modal-gross-profit'
) as HTMLInputElement;

// Modal form inputs - Operating Expenses
const modalExpenses = document.getElementById(
  'modal-expenses'
) as HTMLInputElement;
const modalSga = document.getElementById('modal-sga') as HTMLInputElement;
const modalRd = document.getElementById('modal-rd') as HTMLInputElement;
const modalDepreciation = document.getElementById(
  'modal-depreciation'
) as HTMLInputElement;

// Modal form inputs - Profitability
const modalOperatingIncome = document.getElementById(
  'modal-operating-income'
) as HTMLInputElement;
const modalEbitda = document.getElementById('modal-ebitda') as HTMLInputElement;
const modalPbt = document.getElementById('modal-pbt') as HTMLInputElement;
const modalPat = document.getElementById('modal-pat') as HTMLInputElement;

// Modal form inputs - Interest & Taxes
const modalInterestExpense = document.getElementById(
  'modal-interest-expense'
) as HTMLInputElement;
const modalInterestIncome = document.getElementById(
  'modal-interest-income'
) as HTMLInputElement;
const modalIncomeTax = document.getElementById(
  'modal-income-tax'
) as HTMLInputElement;
const modalTaxRate = document.getElementById(
  'modal-tax-rate'
) as HTMLInputElement;

// Modal form inputs - Assets
const modalFixedAssets = document.getElementById(
  'modal-fixed-assets'
) as HTMLInputElement;
const modalInventories = document.getElementById(
  'modal-inventories'
) as HTMLInputElement;
const modalReceivables = document.getElementById(
  'modal-receivables'
) as HTMLInputElement;
const modalCash = document.getElementById('modal-cash') as HTMLInputElement;

// Modal form inputs - Liabilities
const modalEquity = document.getElementById('modal-equity') as HTMLInputElement;
const modalLongTermDebt = document.getElementById(
  'modal-long-term-debt'
) as HTMLInputElement;
const modalPayables = document.getElementById(
  'modal-payables'
) as HTMLInputElement;
const modalOtherLiabilities = document.getElementById(
  'modal-other-liabilities'
) as HTMLInputElement;

// Modal form inputs - Valuation & Per Share
const modalMarketCap = document.getElementById(
  'modal-market-cap'
) as HTMLInputElement;
const modalSharePrice = document.getElementById(
  'modal-share-price'
) as HTMLInputElement;
const modalEps = document.getElementById('modal-eps') as HTMLInputElement;
const modalDilutedEps = document.getElementById(
  'modal-diluted-eps'
) as HTMLInputElement;
const modalDividend = document.getElementById(
  'modal-dividend'
) as HTMLInputElement;
const modalTotalShares = document.getElementById(
  'modal-total-shares'
) as HTMLInputElement;

// Chart canvases and containers
const canvases = {
  keyMetrics: document.getElementById('chart-key-metrics') as HTMLCanvasElement,
  healthScorecard: document.getElementById(
    'chart-health-scorecard'
  ) as HTMLCanvasElement,
  profitLoss: document.getElementById('chart-profit-loss') as HTMLCanvasElement,
  assets: document.getElementById('chart-assets') as HTMLCanvasElement,
  liabilities: document.getElementById(
    'chart-liabilities'
  ) as HTMLCanvasElement,
  liquidity: document.getElementById('chart-liquidity') as HTMLCanvasElement,
  workingCapital: document.getElementById(
    'chart-working-capital'
  ) as HTMLCanvasElement,
};

const containers = {
  keyMetrics: canvases.keyMetrics.parentElement!,
  healthScorecard: canvases.healthScorecard.parentElement!,
};

// Calculate risk score based on financial metrics
function calculateRiskScore(metrics: Metrics): {
  score: number;
  level: 'low' | 'medium' | 'high';
} {
  let score = 100; // Start with perfect score

  // Liquidity risks
  if (metrics.current_ratio < 1.0) score -= 20;
  else if (metrics.current_ratio < 1.5) score -= 10;

  if (metrics.quick_ratio < 0.5) score -= 15;
  else if (metrics.quick_ratio < 0.8) score -= 8;

  if (metrics.cash_ratio < 0.1) score -= 15;
  else if (metrics.cash_ratio < 0.2) score -= 8;

  // Profitability risks
  if (metrics.net_margin < 0) score -= 25;
  else if (metrics.net_margin < 3) score -= 12;

  if (metrics.roe < 0) score -= 15;
  else if (metrics.roe < 5) score -= 8;

  // Leverage risks
  if (metrics.debt_to_equity > 1.5) score -= 20;
  else if (metrics.debt_to_equity > 0.8) score -= 10;

  // Working capital risks
  if (metrics.working_capital < 0) score -= 20;
  if (metrics.ccc > 120) score -= 10;
  else if (metrics.ccc > 90) score -= 5;

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: 'low' | 'medium' | 'high';
  if (score >= 70) level = 'low';
  else if (score >= 40) level = 'medium';
  else level = 'high';

  return { score, level };
}

// Generate alerts based on financial data
function generateAlerts(
  data: FinancialData,
  metrics: Metrics
): {
  type: 'critical' | 'warning' | 'info' | 'success';
  icon: string;
  message: string;
}[] {
  const alerts: {
    type: 'critical' | 'warning' | 'info' | 'success';
    icon: string;
    message: string;
  }[] = [];

  // Critical alerts
  if (metrics.current_ratio < 1.0) {
    alerts.push({
      type: 'critical',
      icon: '🚨',
      message: `Current ratio (${metrics.current_ratio.toFixed(2)}) below 1.0 - Potential liquidity crisis`,
    });
  }

  if (metrics.net_margin < 0) {
    alerts.push({
      type: 'critical',
      icon: '📉',
      message: `Operating at a loss with ${metrics.net_margin.toFixed(1)}% net margin`,
    });
  }

  if (metrics.working_capital < 0) {
    alerts.push({
      type: 'critical',
      icon: '💰',
      message: `Negative working capital of ${formatINR(metrics.working_capital)}`,
    });
  }

  // Warning alerts
  if (metrics.debt_to_equity > 1.0) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: `High leverage: Debt/Equity ratio of ${metrics.debt_to_equity.toFixed(2)}`,
    });
  }

  if (data.assets.current_assets.cash < 100000) {
    alerts.push({
      type: 'warning',
      icon: '💵',
      message: `Low cash reserves: Only ${formatINR(data.assets.current_assets.cash)}`,
    });
  }

  if (metrics.ccc > 120) {
    alerts.push({
      type: 'warning',
      icon: '🔄',
      message: `Slow cash conversion cycle: ${Math.round(metrics.ccc)} days`,
    });
  }

  if (metrics.quick_ratio < 0.8) {
    alerts.push({
      type: 'warning',
      icon: '⏱️',
      message: `Quick ratio (${metrics.quick_ratio.toFixed(2)}) below industry standard of 0.8`,
    });
  }

  // Info alerts
  if (metrics.dio > 90) {
    alerts.push({
      type: 'info',
      icon: '📦',
      message: `High inventory days: ${Math.round(metrics.dio)} days of stock`,
    });
  }

  if (metrics.dso > 45) {
    alerts.push({
      type: 'info',
      icon: '📋',
      message: `Collection period is ${Math.round(metrics.dso)} days`,
    });
  }

  // Success alerts
  if (metrics.current_ratio >= 2.0) {
    alerts.push({
      type: 'success',
      icon: '✅',
      message: `Strong liquidity with current ratio of ${metrics.current_ratio.toFixed(2)}`,
    });
  }

  if (metrics.net_margin >= 8) {
    alerts.push({
      type: 'success',
      icon: '📈',
      message: `Excellent profitability with ${metrics.net_margin.toFixed(1)}% net margin`,
    });
  }

  if (metrics.roe >= 15) {
    alerts.push({
      type: 'success',
      icon: '🎯',
      message: `Strong ROE of ${metrics.roe.toFixed(1)}%`,
    });
  }

  // Sort by priority: critical > warning > info > success
  const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
  alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

  return alerts.slice(0, 6); // Limit to 6 alerts
}

// Update risk dashboard with animated SVG circle
function updateRiskDashboard() {
  if (!currentData || !currentMetrics) return;

  const { score, level } = calculateRiskScore(currentMetrics);

  // Update score display
  riskScoreValue.textContent = score.toString();
  riskScoreLabel.textContent =
    level === 'low'
      ? 'Low Risk'
      : level === 'medium'
        ? 'Medium Risk'
        : 'High Risk';
  riskScoreLabel.className = `risk-score-label ${level}`;

  // Animate SVG circle
  const circle = document.getElementById(
    'progress-circle'
  ) as unknown as SVGCircleElement;
  if (circle) {
    const circumference = 2 * Math.PI * 60; // r=60
    const offset = circumference - (score / 100) * circumference;

    // Remove all level classes first
    circle.classList.remove('low', 'medium', 'high');
    circle.classList.add(level);

    // Animate the circle
    circle.style.strokeDasharray = `${circumference}`;
    // Reset offset first for animation
    circle.style.transition = 'none';
    circle.style.strokeDashoffset = `${circumference}`;
    // Force reflow then animate
    circle.getBoundingClientRect();
    circle.style.transition = 'stroke-dashoffset 1s ease-out';
    circle.style.strokeDashoffset = `${offset}`;
  }

  // Update alerts (limit to 5 for compact view)
  const alerts = generateAlerts(currentData, currentMetrics);
  alertsList.innerHTML = alerts
    .slice(0, 5)
    .map(
      (alert) => `
    <div class="alert-item ${alert.type}">
      <span class="alert-icon">${alert.icon}</span>
      <span>${alert.message}</span>
    </div>
  `
    )
    .join('');
}

// Update key metrics in the executive summary
function updateKeyMetrics() {
  if (!currentData || !currentMetrics) return;

  metricRevenue.textContent = formatINR(currentData.income_statement.revenue);

  const profit = currentData.income_statement.pat;
  metricProfit.textContent = formatINR(profit);
  metricProfit.className = `metric-value ${profit >= 0 ? 'positive' : 'negative'}`;

  metricMargin.textContent = `${currentMetrics.net_margin.toFixed(1)}%`;
  metricMargin.className = `metric-value ${currentMetrics.net_margin >= 0 ? 'positive' : 'negative'}`;

  metricCurrentRatio.textContent = currentMetrics.current_ratio.toFixed(2);
  metricCurrentRatio.className = `metric-value ${currentMetrics.current_ratio >= 1.5 ? 'positive' : currentMetrics.current_ratio >= 1 ? '' : 'warning'}`;

  metricDebtEquity.textContent = currentMetrics.debt_to_equity.toFixed(2);
  metricDebtEquity.className = `metric-value ${currentMetrics.debt_to_equity <= 0.5 ? 'positive' : currentMetrics.debt_to_equity <= 1 ? '' : 'negative'}`;

  metricCash.textContent = formatINR(currentData.assets.current_assets.cash);
  metricCash.className = `metric-value ${currentData.assets.current_assets.cash >= 100000 ? 'positive' : 'negative'}`;
}

// Update company display section with conditional rendering
function updateCompanyDisplay() {
  if (!currentData) return;

  // Set the selector to show the current company name
  // The selector already shows the company name, so no need to update it

  // Build meta items dynamically based on available data
  const metaItems: { label: string; value: string }[] = [];

  // Promoter Holding (always calculate if shareholding exists)
  const totalShares =
    currentData.total_shares || currentData.liabilities.equity.share_capital;
  const totalShareholding = Object.values(currentData.shareholding).reduce(
    (a, b) => a + b,
    0
  );
  if (totalShareholding > 0 && totalShares > 0) {
    const promoterHoldingPct = (
      (totalShareholding / totalShares) *
      100
    ).toFixed(1);
    metaItems.push({
      label: 'Promoter Holding',
      value: `${promoterHoldingPct}%`,
    });
  }

  // Market Cap
  if (currentData.market_cap) {
    metaItems.push({
      label: 'Market Cap',
      value: formatINR(currentData.market_cap),
    });
  }

  // Share Price
  if (currentData.share_price) {
    metaItems.push({
      label: 'Share Price',
      value: `₹${currentData.share_price.toFixed(2)}`,
    });
  }

  // EPS
  if (currentData.eps !== undefined) {
    metaItems.push({ label: 'EPS', value: `₹${currentData.eps.toFixed(2)}` });
  }

  // Diluted EPS
  if (currentData.diluted_eps !== undefined) {
    metaItems.push({
      label: 'Diluted EPS',
      value: `₹${currentData.diluted_eps.toFixed(2)}`,
    });
  }

  // Dividend Per Share
  if (currentData.income_statement.dividend_per_share !== undefined) {
    metaItems.push({
      label: 'Dividend',
      value: `₹${currentData.income_statement.dividend_per_share.toFixed(2)}`,
    });
  }

  // Gross Profit
  if (currentData.income_statement.gross_profit !== undefined) {
    metaItems.push({
      label: 'Gross Profit',
      value: formatINR(currentData.income_statement.gross_profit),
    });
  }

  // EBIT (Operating Income)
  if (currentData.income_statement.operating_income !== undefined) {
    metaItems.push({
      label: 'EBIT',
      value: formatINR(currentData.income_statement.operating_income),
    });
  }

  // EBITDA
  if (currentData.income_statement.ebitda !== undefined) {
    metaItems.push({
      label: 'EBITDA',
      value: formatINR(currentData.income_statement.ebitda),
    });
  }

  // Tax Rate
  if (currentData.income_statement.tax_rate !== undefined) {
    metaItems.push({
      label: 'Tax Rate',
      value: `${currentData.income_statement.tax_rate.toFixed(1)}%`,
    });
  }

  // Render meta items
  companyMetaContainer.innerHTML = metaItems
    .map(
      (item) => `
    <span class="meta-item">
      <span class="meta-label">${item.label}:</span> ${item.value}
    </span>
  `
    )
    .join('');
}

// Validate JSON data
function validateData(data: any): data is FinancialData {
  return (
    data &&
    typeof data.company_name === 'string' &&
    data.income_statement &&
    typeof data.income_statement.revenue === 'number' &&
    data.assets &&
    data.assets.fixed_assets &&
    data.assets.current_assets &&
    data.liabilities &&
    data.liabilities.equity &&
    data.liabilities.non_current_liabilities &&
    data.liabilities.current_liabilities
  );
}

// Load metadata.json and localStorage to get list of available companies
async function loadMetadata(): Promise<
  { name: string; source: 'public' | 'local' }[]
> {
  const companies: { name: string; source: 'public' | 'local' }[] = [];

  // Load public companies
  try {
    const response = await fetch('metadata.json');
    if (response.ok) {
      const data = await response.json();
      const publicCompanies = data.companies || [];
      companies.push(
        ...publicCompanies.map((name: string) => ({
          name,
          source: 'public' as const,
        }))
      );
    }
  } catch (error) {
    console.error('Error loading metadata:', error);
  }

  // Load localStorage companies
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.endsWith('.json') && key !== LAST_SELECTED_KEY) {
      companies.push({ name: key, source: 'local' as const });
    }
  }

  return companies;
}

// Load company data from JSON file or localStorage
async function loadCompanyData(
  filename: string
): Promise<FinancialData | null> {
  // Check if it's a localStorage file
  if (filename.endsWith('.json')) {
    const stored = localStorage.getItem(filename);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (validateData(data)) {
          return data;
        }
      } catch (e) {
        console.error('Error parsing stored data for', filename, e);
      }
    }
  }

  // Otherwise, fetch from public folder
  try {
    const response = await fetch(filename);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
    }
    const data = await response.json();
    if (validateData(data)) {
      return data;
    } else {
      console.error('Invalid data structure in', filename);
      return null;
    }
  } catch (error) {
    console.error('Error loading company data:', error);
    return null;
  }
}

// Populate company selector
async function populateCompanySelector(
  companies: { name: string; source: 'public' | 'local' }[]
) {
  companySelector.innerHTML = '<option value="">Select Company</option>';
  for (const company of companies) {
    const option = document.createElement('option');
    option.value = company.name;

    // Load company data to get the actual company name
    const data = await loadCompanyData(company.name);
    let displayName = data
      ? data.company_name
      : company.name.replace('.json', '').replace(/_/g, ' ');
    if (company.source === 'local') {
      displayName += ' (Uploaded)';
    }
    option.textContent = displayName;
    companySelector.appendChild(option);
  }
}

// Show error message
function showError(message: string) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
  errorMessage.style.display = 'none';
}

// Save last selected company to localStorage
function saveLastSelected(companyName: string) {
  localStorage.setItem(LAST_SELECTED_KEY, companyName);
}

// Load last selected company from localStorage
function loadLastSelected(): string | null {
  return localStorage.getItem(LAST_SELECTED_KEY);
}

// Load data from file
function loadFromFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (validateData(data)) {
        // Save to localStorage with company name as key
        const companyKey = data.company_name.replace(/\s+/g, '_') + '.json';
        localStorage.setItem(companyKey, JSON.stringify(data));

        // Reload metadata and selector
        loadMetadata().then(async (companies) => {
          availableCompanies = companies;
          await populateCompanySelector(availableCompanies);
          companySelector.value = companyKey;
          saveLastSelected(companyKey);
        });

        currentData = data;
        currentMetrics = calculateMetrics(data, cogsPercentage);
        renderCharts();
        updateRiskDashboard();
        updateKeyMetrics();
        updateCompanyDisplay();
        hideError();
        closeModal();
      } else {
        showError('Invalid JSON structure. Please check the required fields.');
      }
    } catch (error) {
      showError('Invalid JSON format.');
    }
  };
  reader.readAsText(file);
}

// Export report as text
function exportReport() {
  if (!currentData || !currentMetrics) {
    alert('Please load financial data first');
    return;
  }

  const { score, level } = calculateRiskScore(currentMetrics);
  const alerts = generateAlerts(currentData, currentMetrics);

  const report = `
REDFLAG FINANCIAL ANALYSIS REPORT
==================================
Company: ${currentData.company_name}
Generated: ${new Date().toLocaleString()}

RISK ASSESSMENT
---------------
Overall Risk Score: ${score}/100 (${level.toUpperCase()} RISK)

KEY METRICS
-----------
Revenue: ${formatINR(currentData.income_statement.revenue)}
Net Profit: ${formatINR(currentData.income_statement.pat)}
Net Margin: ${currentMetrics.net_margin.toFixed(2)}%
ROE: ${currentMetrics.roe.toFixed(2)}%
ROA: ${currentMetrics.roa.toFixed(2)}%

LIQUIDITY RATIOS
----------------
Current Ratio: ${currentMetrics.current_ratio.toFixed(2)}
Quick Ratio: ${currentMetrics.quick_ratio.toFixed(2)}
Cash Ratio: ${currentMetrics.cash_ratio.toFixed(2)}

LEVERAGE RATIOS
---------------
Debt/Equity: ${currentMetrics.debt_to_equity.toFixed(2)}
Debt/Assets: ${currentMetrics.debt_to_assets.toFixed(2)}

WORKING CAPITAL
---------------
Working Capital: ${formatINR(currentMetrics.working_capital)}
Inventory Days: ${Math.round(currentMetrics.dio)}
Collection Days: ${Math.round(currentMetrics.dso)}
Payment Days: ${Math.round(currentMetrics.dpo)}
Cash Conversion Cycle: ${Math.round(currentMetrics.ccc)} days

ALERTS & RECOMMENDATIONS
------------------------
${alerts.map((a) => `[${a.type.toUpperCase()}] ${a.message}`).join('\n')}

---
Report generated by RedFlag - MCA Financial Analysis
`.trim();

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentData.company_name.replace(/\s+/g, '_')}_financial_report.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Load initial data (from localStorage or default company)
async function loadInitialData() {
  // Load metadata first
  availableCompanies = await loadMetadata();
  await populateCompanySelector(availableCompanies);

  const lastSelected = loadLastSelected();
  let selectedCompany = lastSelected;

  if (!selectedCompany && availableCompanies.length > 0) {
    selectedCompany = availableCompanies[0].name;
  }

  if (selectedCompany) {
    const companyData = await loadCompanyData(selectedCompany);
    if (companyData) {
      currentData = companyData;
      companySelector.value = selectedCompany;
    } else if (availableCompanies.length > 0) {
      // Fallback to first company
      const fallbackCompany = availableCompanies[0];
      const fallbackData = await loadCompanyData(fallbackCompany.name);
      if (fallbackData) {
        currentData = fallbackData;
        companySelector.value = fallbackCompany.name;
        saveLastSelected(fallbackCompany.name);
      }
    }
  }

  if (currentData) {
    currentMetrics = calculateMetrics(currentData, cogsPercentage);
    renderCharts();
    updateRiskDashboard();
    updateKeyMetrics();
    updateCompanyDisplay();
  }
  hideError();
}

// Add insights to chart containers
function addInsights(chartId: string, insight: string) {
  const canvas = document.querySelector(`#chart-${chartId}`) as HTMLElement;
  if (!canvas) return;

  const container = canvas.closest('.chart-container') as HTMLElement;
  if (!container) return;

  let insightsDiv = container.querySelector('.chart-insights') as HTMLElement;
  if (!insightsDiv) {
    insightsDiv = document.createElement('div');
    insightsDiv.className = 'chart-insights';
    // Insert after chart-content
    const chartContent = container.querySelector('.chart-content');
    if (chartContent) {
      chartContent.after(insightsDiv);
    }
  }
  insightsDiv.textContent = insight;
}

// Render all charts
function renderCharts() {
  if (!currentData || !currentMetrics) {
    console.log('No data or metrics available');
    return;
  }

  chartsContainer.style.display = 'grid';

  try {
    createKeyMetricsChart(
      containers.keyMetrics,
      currentData,
      currentMetrics,
      cogsPercentage
    );
    createHealthScorecardChart(containers.healthScorecard, currentMetrics, 1.0);
    createProfitLossChart(canvases.profitLoss, currentData, 1.0);
    createAssetCompositionChart(
      canvases.assets,
      currentData,
      currentMetrics,
      0.5
    );
    createLiabilityCompositionChart(
      canvases.liabilities,
      currentData,
      currentMetrics,
      0.5
    );
    createLiquidityChart(canvases.liquidity, currentMetrics, 1.5);
    createWorkingCapitalChart(canvases.workingCapital, currentMetrics, 90);

    // Add insights
    addInsights(
      'key-metrics',
      generateKeyMetricsInsights(currentData, currentMetrics)
    );
    addInsights(
      'health-scorecard',
      generateHealthScorecardInsights(currentMetrics, 1.0)
    );
    addInsights('profit-loss', generateProfitLossInsights(currentData));
    addInsights(
      'assets',
      generateAssetCompositionInsights(currentData, currentMetrics)
    );
    addInsights(
      'liabilities',
      generateLiabilityCompositionInsights(currentData, currentMetrics)
    );
    addInsights('liquidity', generateLiquidityInsights(currentMetrics, 1.5));
    addInsights(
      'working-capital',
      generateWorkingCapitalInsights(currentMetrics, 90)
    );
  } catch (error) {
    console.error('Error rendering charts:', error);
  }
}

// Modal functions
function openModal() {
  modalOverlay.classList.add('active');
  populateModalForm();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function populateModalForm() {
  if (!currentData) return;

  // Revenue & Cost
  modalRevenue.value = currentData.income_statement.revenue.toString();
  modalOtherIncome.value = currentData.income_statement.other_income.toString();
  modalCogs.value =
    currentData.income_statement.cost_of_goods_sold?.toString() || '';
  modalGrossProfit.value =
    currentData.income_statement.gross_profit?.toString() || '';

  // Operating Expenses
  modalExpenses.value = currentData.income_statement.total_expenses.toString();
  modalSga.value =
    currentData.income_statement.selling_general_admin?.toString() || '';
  modalRd.value =
    currentData.income_statement.research_development?.toString() || '';
  modalDepreciation.value =
    currentData.income_statement.depreciation_amortization?.toString() || '';

  // Profitability
  modalOperatingIncome.value =
    currentData.income_statement.operating_income?.toString() || '';
  modalEbitda.value = currentData.income_statement.ebitda?.toString() || '';
  modalPbt.value = currentData.income_statement.pbt.toString();
  modalPat.value = currentData.income_statement.pat.toString();

  // Interest & Taxes
  modalInterestExpense.value =
    currentData.income_statement.interest_expense?.toString() || '';
  modalInterestIncome.value =
    currentData.income_statement.interest_income?.toString() || '';
  modalIncomeTax.value =
    currentData.income_statement.income_tax?.toString() || '';
  modalTaxRate.value = currentData.income_statement.tax_rate?.toString() || '';

  // Assets
  const totalFixedAssets = Object.values(
    currentData.assets.fixed_assets
  ).reduce((a, b) => a + b, 0);
  modalFixedAssets.value = totalFixedAssets.toString();
  modalInventories.value =
    currentData.assets.current_assets.inventories.toString();
  modalReceivables.value =
    currentData.assets.current_assets.trade_receivables.toString();
  modalCash.value = currentData.assets.current_assets.cash.toString();

  // Liabilities
  const totalEquity = Object.values(currentData.liabilities.equity).reduce(
    (a, b) => a + b,
    0
  );
  modalEquity.value = totalEquity.toString();
  modalLongTermDebt.value =
    currentData.liabilities.non_current_liabilities.long_term_borrowings.toString();
  modalPayables.value =
    currentData.liabilities.current_liabilities.trade_payables.toString();
  const totalOtherLiabilities =
    Object.values(currentData.liabilities.current_liabilities).reduce(
      (a, b) => a + b,
      0
    ) - currentData.liabilities.current_liabilities.trade_payables;
  modalOtherLiabilities.value = totalOtherLiabilities.toString();

  // Valuation & Per Share
  modalMarketCap.value = currentData.market_cap?.toString() || '';
  modalSharePrice.value = currentData.share_price?.toString() || '';
  modalEps.value = currentData.eps?.toString() || '';
  modalDilutedEps.value = currentData.diluted_eps?.toString() || '';
  modalDividend.value =
    currentData.income_statement.dividend_per_share?.toString() || '';
  modalTotalShares.value = currentData.total_shares?.toString() || '';
}

function saveModalForm() {
  if (!currentData) return;

  // Revenue & Cost
  currentData.income_statement.revenue = parseFloat(modalRevenue.value) || 0;
  currentData.income_statement.other_income =
    parseFloat(modalOtherIncome.value) || 0;
  if (modalCogs.value)
    currentData.income_statement.cost_of_goods_sold = parseFloat(
      modalCogs.value
    );
  if (modalGrossProfit.value)
    currentData.income_statement.gross_profit = parseFloat(
      modalGrossProfit.value
    );

  // Operating Expenses
  currentData.income_statement.total_expenses =
    parseFloat(modalExpenses.value) || 0;
  if (modalSga.value)
    currentData.income_statement.selling_general_admin = parseFloat(
      modalSga.value
    );
  if (modalRd.value)
    currentData.income_statement.research_development = parseFloat(
      modalRd.value
    );
  if (modalDepreciation.value)
    currentData.income_statement.depreciation_amortization = parseFloat(
      modalDepreciation.value
    );

  // Profitability
  if (modalOperatingIncome.value)
    currentData.income_statement.operating_income = parseFloat(
      modalOperatingIncome.value
    );
  if (modalEbitda.value)
    currentData.income_statement.ebitda = parseFloat(modalEbitda.value);
  currentData.income_statement.pbt =
    parseFloat(modalPbt.value) || currentData.income_statement.pat;
  currentData.income_statement.pat = parseFloat(modalPat.value) || 0;

  // Interest & Taxes
  if (modalInterestExpense.value)
    currentData.income_statement.interest_expense = parseFloat(
      modalInterestExpense.value
    );
  if (modalInterestIncome.value)
    currentData.income_statement.interest_income = parseFloat(
      modalInterestIncome.value
    );
  if (modalIncomeTax.value)
    currentData.income_statement.income_tax = parseFloat(modalIncomeTax.value);
  if (modalTaxRate.value)
    currentData.income_statement.tax_rate = parseFloat(modalTaxRate.value);

  // Assets
  const fixedAssets = parseFloat(modalFixedAssets.value) || 0;
  currentData.assets.fixed_assets.property_equipment = Math.round(
    fixedAssets * 0.25
  );
  currentData.assets.fixed_assets.intangible_assets = Math.round(
    fixedAssets * 0.33
  );
  currentData.assets.fixed_assets.other_non_current = Math.round(
    fixedAssets * 0.42
  );

  currentData.assets.current_assets.inventories =
    parseFloat(modalInventories.value) || 0;
  currentData.assets.current_assets.trade_receivables =
    parseFloat(modalReceivables.value) || 0;
  currentData.assets.current_assets.cash = parseFloat(modalCash.value) || 0;
  currentData.assets.current_assets.other_current =
    parseFloat(modalCash.value) * 75; // Simplified

  // Liabilities
  const equity = parseFloat(modalEquity.value) || 0;
  currentData.liabilities.equity.share_capital = Math.round(equity * 0.19);
  currentData.liabilities.equity.reserves_surplus = Math.round(equity * 0.81);

  currentData.liabilities.non_current_liabilities.long_term_borrowings =
    parseFloat(modalLongTermDebt.value) || 0;
  currentData.liabilities.current_liabilities.trade_payables =
    parseFloat(modalPayables.value) || 0;
  currentData.liabilities.current_liabilities.other_current_liabilities =
    Math.round((parseFloat(modalOtherLiabilities.value) || 0) * 0.78);
  currentData.liabilities.current_liabilities.current_liability = Math.round(
    (parseFloat(modalOtherLiabilities.value) || 0) * 0.22
  );

  // Valuation & Per Share
  if (modalMarketCap.value)
    currentData.market_cap = parseFloat(modalMarketCap.value);
  if (modalSharePrice.value)
    currentData.share_price = parseFloat(modalSharePrice.value);
  if (modalEps.value) currentData.eps = parseFloat(modalEps.value);
  if (modalDilutedEps.value)
    currentData.diluted_eps = parseFloat(modalDilutedEps.value);
  if (modalDividend.value)
    currentData.income_statement.dividend_per_share = parseFloat(
      modalDividend.value
    );
  if (modalTotalShares.value)
    currentData.total_shares = parseFloat(modalTotalShares.value);

  // Recalculate metrics and update UI
  currentMetrics = calculateMetrics(currentData, cogsPercentage);

  // Save back to localStorage if it's a local file
  const currentCompany = companySelector.value;
  if (currentCompany && localStorage.getItem(currentCompany)) {
    localStorage.setItem(currentCompany, JSON.stringify(currentData));
  }

  renderCharts();
  updateRiskDashboard();
  updateKeyMetrics();
  updateCompanyDisplay();
  closeModal();
}

// Event listeners
uploadBtn.addEventListener('click', openModal);

// Upload JSON button
const uploadJsonBtn = document.getElementById(
  'upload-json-btn'
) as HTMLButtonElement;
uploadJsonBtn.addEventListener('click', () => {
  fileInput.click();
});

modalCloseBtn.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
modalSaveBtn.addEventListener('click', saveModalForm);

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    closeModal();
  }
});

// Close modal on backdrop click
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// File input in modal
modalFileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    loadFromFile(file);
  }
});

// Hidden file input (for external file trigger)
fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    loadFromFile(file);
  }
});

if (exportReportBtn) {
  exportReportBtn.addEventListener('click', exportReport);
}

// Company selector event listener
companySelector.addEventListener('change', async (e) => {
  const selectedCompany = (e.target as HTMLSelectElement).value;
  if (selectedCompany) {
    const companyData = await loadCompanyData(selectedCompany);
    if (companyData) {
      currentData = companyData;
      currentMetrics = calculateMetrics(currentData, cogsPercentage);
      saveLastSelected(selectedCompany);
      renderCharts();
      updateRiskDashboard();
      updateKeyMetrics();
      updateCompanyDisplay();
      hideError();
    } else {
      showError('Failed to load company data');
    }
  }
});

// Initialize with data
loadInitialData();
