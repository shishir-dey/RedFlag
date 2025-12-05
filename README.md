# <img src="public/logo.png" height="24" /> RedFlag - MCA Financial Analysis Web App

RedFlag is a modern, responsive web application that analyzes MCA (Ministry of Corporate Affairs) financial data and visualizes potential risk indicators or "red flags" through interactive charts and metrics.

## Features

- **Data Loading**: Upload JSON files or paste financial data directly
- **Real-time Analysis**: Automatic calculation of key financial ratios and metrics
- **Interactive Visualizations**: 6 comprehensive charts showing different aspects of financial health
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Apple-inspired UI**: Clean, minimal design with smooth interactions

## Charts Included

1. **Key Metrics Summary** - Overview of important financial figures
2. **Financial Health Scorecard** - Color-coded assessment of liquidity, profitability, leverage, and efficiency ratios
3. **Profit & Loss Waterfall** - Breakdown of revenue to net profit
4. **Asset Composition** - Distribution of fixed and current assets
5. **Liability & Equity Composition** - Capital structure breakdown
6. **Liquidity Indicators** - Current, quick, and cash ratios
7. **Working Capital Cycle** - Days analysis for inventory, receivables, and payables

## Expected JSON Schema

The app expects MCA financial data in the following JSON format:

```json
{
  "company_name": "Company Name",
  "income_statement": {
    "revenue": 1000000,
    "other_income": 50000,
    "total_expenses": 900000,
    "cost_of_materials": 600000,
    "other_expenses": 300000,
    "pbt": 150000,
    "pat": 100000
  },
  "assets": {
    "fixed_assets": {
      "property_equipment": 500000,
      "intangible_assets": 100000,
      "other_non_current": 200000
    },
    "current_assets": {
      "inventories": 300000,
      "trade_receivables": 200000,
      "cash": 50000,
      "other_current": 100000
    }
  },
  "liabilities": {
    "equity": {
      "share_capital": 200000,
      "reserves_surplus": 400000
    },
    "non_current_liabilities": {
      "long_term_borrowings": 300000,
      "deferred_tax": 10000,
      "long_term_provisions": 20000
    },
    "current_liabilities": {
      "trade_payables": 150000,
      "other_current_liabilities": 50000,
      "short_term_provisions": 0,
      "current_liability": 25000
    }
  },
  "shareholding": {
    "director1": 150000,
    "director2": 50000
  },
  "pending_allotment": {
    "director1": 10000,
    "director2": 5000
  },
  "forex_exposure_usd": 10000.0,
  "usd_to_inr_rate": 83
}
```

## Local Development

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/shishir-dey/RedFlag.git
   cd RedFlag
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select "GitHub Actions" as the source

2. **Repository Settings**:
   - The workflow file (`.github/workflows/gh-pages.yml`) handles the deployment
   - On each push to the `main` branch, the app will be built and deployed

3. **Access Your Site**:
   - After deployment, your site will be available at: `https://[username].github.io/RedFlag/`
   - For project sites (like this one), the URL includes the repository name

### Workflow Details

The GitHub Actions workflow:

- Triggers on pushes and pull requests to `main`
- Uses Node.js 18
- Installs dependencies with `npm ci`
- Builds the project with `npm run build`
- Deploys the `dist` directory to the `gh-pages` branch

## Technology Stack

- **Frontend Framework**: Vite + TypeScript
- **Charts**: Chart.js
- **Styling**: Vanilla CSS with Apple-inspired design
- **Build Tool**: Vite
- **Deployment**: GitHub Pages with GitHub Actions

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- No server-side dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

Shishir Dey
