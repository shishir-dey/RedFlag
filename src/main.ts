import { FinancialData } from './types';
import { calculateMetrics } from './metrics';
import {
  createKeyMetricsChart,
  createHealthScorecardChart,
  createProfitLossChart,
  createAssetCompositionChart,
  createLiabilityCompositionChart,
  createLiquidityChart,
  createWorkingCapitalChart,
} from './charts';
import { sampleData } from './sampleData';

// Global state
let currentData: FinancialData | null = null;
let currentMetrics: any = null;
let cogsPercentage = 85; // Default COGS percentage

// DOM elements
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const downloadSampleBtn = document.getElementById(
  'download-sample'
) as HTMLButtonElement;
const errorMessage = document.getElementById('error-message') as HTMLDivElement;
const chartsContainer = document.getElementById(
  'charts-container'
) as HTMLDivElement;

console.log('DOM elements found:', {
  fileInput: !!fileInput,
  downloadSampleBtn: !!downloadSampleBtn,
  errorMessage: !!errorMessage,
  chartsContainer: !!chartsContainer,
});

// Input elements for data editing
const revenueInput = document.getElementById(
  'revenue-input'
) as HTMLInputElement;
const otherIncomeInput = document.getElementById(
  'other-income-input'
) as HTMLInputElement;
const expensesInput = document.getElementById(
  'expenses-input'
) as HTMLInputElement;
const patInput = document.getElementById('pat-input') as HTMLInputElement;
const fixedAssetsInput = document.getElementById(
  'fixed-assets-input'
) as HTMLInputElement;
const inventoriesInput = document.getElementById(
  'inventories-input'
) as HTMLInputElement;
const receivablesInput = document.getElementById(
  'receivables-input'
) as HTMLInputElement;
const cashInput = document.getElementById('cash-input') as HTMLInputElement;
const equityInput = document.getElementById('equity-input') as HTMLInputElement;
const longTermDebtInput = document.getElementById(
  'long-term-debt-input'
) as HTMLInputElement;
const payablesInput = document.getElementById(
  'payables-input'
) as HTMLInputElement;
const otherLiabilitiesInput = document.getElementById(
  'other-liabilities-input'
) as HTMLInputElement;

// Sliders and value displays
const cogsSlider = document.getElementById('cogs-slider') as HTMLInputElement;
const cogsValue = document.getElementById('cogs-value') as HTMLSpanElement;
const scorecardSlider = document.getElementById(
  'scorecard-slider'
) as HTMLInputElement;
const scorecardValue = document.getElementById(
  'scorecard-value'
) as HTMLSpanElement;
const liquiditySlider = document.getElementById(
  'liquidity-slider'
) as HTMLInputElement;
const liquidityValue = document.getElementById(
  'liquidity-value'
) as HTMLSpanElement;
const workingCapitalSlider = document.getElementById(
  'working-capital-slider'
) as HTMLInputElement;
const workingCapitalValue = document.getElementById(
  'working-capital-value'
) as HTMLSpanElement;

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

console.log(
  'Canvases found:',
  Object.keys(canvases).map(
    (key) => `${key}: ${!!canvases[key as keyof typeof canvases]}`
  )
);

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

// Show error message
function showError(message: string) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
  errorMessage.style.display = 'none';
}

// Load data from file
function loadFromFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (validateData(data)) {
        currentData = data;
        currentMetrics = calculateMetrics(data, cogsPercentage);
        renderCharts();
        populateInputFields();
        hideError();
      } else {
        showError('Invalid JSON structure. Please check the required fields.');
      }
    } catch (error) {
      showError('Invalid JSON format.');
    }
  };
  reader.readAsText(file);
}

// Download sample data
function downloadSampleData() {
  const dataStr = JSON.stringify(sampleData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample_financial_data.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Load sample data
function loadSampleData() {
  currentData = sampleData;
  currentMetrics = calculateMetrics(sampleData, cogsPercentage);
  renderCharts();
  hideError();
}

// Render all charts
function renderCharts() {
  if (!currentData || !currentMetrics) {
    console.log('No data or metrics available');
    return;
  }

  console.log(
    'Rendering charts with data:',
    currentData,
    'metrics:',
    currentMetrics
  );
  chartsContainer.style.display = 'grid';

  // For now, use default parameters since we're focusing on data inputs
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
    console.log('Charts rendered successfully');
  } catch (error) {
    console.error('Error rendering charts:', error);
  }
}

// Event listeners
fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    loadFromFile(file);
  }
});

downloadSampleBtn.addEventListener('click', downloadSampleData);

// Update value displays
function updateValueDisplays() {
  cogsValue.textContent = `${cogsSlider.value}%`;
  scorecardValue.textContent = `${scorecardSlider.value}x`;
  liquidityValue.textContent = liquiditySlider.value;
  workingCapitalValue.textContent = workingCapitalSlider.value;
}

// Update data from input fields
function updateDataFromInputs() {
  if (!currentData) return;

  // Update income statement
  currentData.income_statement.revenue = parseFloat(revenueInput.value) || 0;
  currentData.income_statement.other_income =
    parseFloat(otherIncomeInput.value) || 0;
  currentData.income_statement.total_expenses =
    parseFloat(expensesInput.value) || 0;
  currentData.income_statement.pat = parseFloat(patInput.value) || 0;
  currentData.income_statement.pbt = currentData.income_statement.pat; // Simplified

  // Update assets
  const fixedAssets = parseFloat(fixedAssetsInput.value) || 0;
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
    parseFloat(inventoriesInput.value) || 0;
  currentData.assets.current_assets.trade_receivables =
    parseFloat(receivablesInput.value) || 0;
  currentData.assets.current_assets.cash = parseFloat(cashInput.value) || 0;
  currentData.assets.current_assets.other_current =
    parseFloat(cashInput.value) * 75; // Simplified

  // Update liabilities
  const equity = parseFloat(equityInput.value) || 0;
  currentData.liabilities.equity.share_capital = Math.round(equity * 0.19);
  currentData.liabilities.equity.reserves_surplus = Math.round(equity * 0.81);

  currentData.liabilities.non_current_liabilities.long_term_borrowings =
    parseFloat(longTermDebtInput.value) || 0;
  currentData.liabilities.current_liabilities.trade_payables =
    parseFloat(payablesInput.value) || 0;
  currentData.liabilities.current_liabilities.other_current_liabilities =
    Math.round((parseFloat(otherLiabilitiesInput.value) || 0) * 0.78);
  currentData.liabilities.current_liabilities.current_liability = Math.round(
    (parseFloat(otherLiabilitiesInput.value) || 0) * 0.22
  );

  // Recalculate metrics
  currentMetrics = calculateMetrics(currentData, cogsPercentage);
  renderCharts();
}

// Populate input fields with current data
function populateInputFields() {
  if (!currentData) return;

  revenueInput.value = currentData.income_statement.revenue.toString();
  otherIncomeInput.value = currentData.income_statement.other_income.toString();
  expensesInput.value = currentData.income_statement.total_expenses.toString();
  patInput.value = currentData.income_statement.pat.toString();

  const totalFixedAssets = Object.values(
    currentData.assets.fixed_assets
  ).reduce((a, b) => a + b, 0);
  fixedAssetsInput.value = totalFixedAssets.toString();
  inventoriesInput.value =
    currentData.assets.current_assets.inventories.toString();
  receivablesInput.value =
    currentData.assets.current_assets.trade_receivables.toString();
  cashInput.value = currentData.assets.current_assets.cash.toString();

  const totalEquity = Object.values(currentData.liabilities.equity).reduce(
    (a, b) => a + b,
    0
  );
  equityInput.value = totalEquity.toString();
  longTermDebtInput.value =
    currentData.liabilities.non_current_liabilities.long_term_borrowings.toString();
  payablesInput.value =
    currentData.liabilities.current_liabilities.trade_payables.toString();
  const totalOtherLiabilities =
    Object.values(currentData.liabilities.current_liabilities).reduce(
      (a, b) => a + b,
      0
    ) - currentData.liabilities.current_liabilities.trade_payables;
  otherLiabilitiesInput.value = totalOtherLiabilities.toString();
}

// Slider event listeners - only render on mouseup/touchend
cogsSlider.addEventListener('input', () => {
  cogsValue.textContent = `${cogsSlider.value}%`;
});

cogsSlider.addEventListener('change', () => {
  cogsPercentage = parseInt(cogsSlider.value);
  if (currentData) {
    currentMetrics = calculateMetrics(currentData, cogsPercentage);
    renderCharts();
  }
});

scorecardSlider.addEventListener('input', () => {
  scorecardValue.textContent = `${scorecardSlider.value}x`;
});

scorecardSlider.addEventListener('change', () => {
  renderCharts();
});

liquiditySlider.addEventListener('input', () => {
  liquidityValue.textContent = liquiditySlider.value;
});

liquiditySlider.addEventListener('change', () => {
  renderCharts();
});

workingCapitalSlider.addEventListener('input', () => {
  workingCapitalValue.textContent = workingCapitalSlider.value;
});

workingCapitalSlider.addEventListener('change', () => {
  renderCharts();
});

// Input field event listeners
const inputFields = [
  revenueInput,
  otherIncomeInput,
  expensesInput,
  patInput,
  fixedAssetsInput,
  inventoriesInput,
  receivablesInput,
  cashInput,
  equityInput,
  longTermDebtInput,
  payablesInput,
  otherLiabilitiesInput,
];

inputFields.forEach((input) => {
  input.addEventListener('input', updateDataFromInputs);
});

// Initialize with sample data
loadSampleData();
updateValueDisplays();
populateInputFields();
