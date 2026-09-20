# TaxHarvest

A tax-loss harvesting and capital-gains planning dashboard for Indian traders and investors — built with a FastAPI backend implementing real Indian income-tax logic (FY 2025-26 / AY 2026-27) and a React + Tailwind dark-mode frontend with Bloomberg-style data visualizations.

![Status](https://img.shields.io/badge/status-active--development-blue)
![Python](https://img.shields.io/badge/backend-FastAPI-009688)
![React](https://img.shields.io/badge/frontend-React%2019-61dafb)

> ⚠️ **Not tax advice.** TaxHarvest is a planning and education tool. Tax law changes every Union Budget, and this project's calculations should always be verified by a Chartered Accountant before being relied on for an actual return. See [Disclaimer](#disclaimer) below.

---

## What it does

- Computes Indian income tax under the **New Tax Regime** (FY 2025-26 / AY 2026-27): progressive slabs, standard deduction, Section 87A rebate.
- Computes **capital gains tax** separately under Sections 111A/112A (STCG 20%, LTCG 12.5% with ₹1.25L exemption).
- Applies the **statutory set-off waterfall**: LTCL → LTCG, STCL → STCG then LTCG, speculative losses ring-fenced to speculative income, business losses never offset salary.
- Tracks **carry-forwards** with correct statutory expiry windows (8 years for capital losses, 4 for speculative losses).
- Surfaces **tax-loss harvesting opportunities** from your holdings, ranked by potential tax savings.
- Visualizes everything: tax breakdown donut, segment performance heatmap, harvest opportunity scatter plot, detailed waterfall calculation.

## Tech stack

**Backend** — FastAPI, SQLAlchemy, SQLite (swappable to Postgres via `DATABASE_URL`), JWT auth (`python-jose` + `bcrypt`), Pydantic v2.

**Frontend** — React 19, Vite, Tailwind CSS v4, Recharts, Framer Motion, Zustand, React Router.

## Project structure

```
taxharvest/
├── backend/
│   ├── app/
│   │   ├── core/          # config, db session, security/JWT
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # tax_engine.py — the calculation logic
│   │   ├── routers/       # auth, profile, holdings, calculate
│   │   └── main.py        # FastAPI app entrypoint
│   ├── tests/
│   │   └── test_tax_engine.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # Sidebar, StatCard, SegmentHeatmap, HarvestScatter
    │   ├── pages/          # Login, Signup, Dashboard, Holdings, Results, Harvest
    │   ├── store/          # Zustand stores (auth, tax data)
    │   └── lib/            # API client, formatters
    └── package.json
```

## Getting started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be live at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend on port 8000.

### 3. Try it out

Open `http://localhost:5173`, create an account, and the dashboard will populate with sample holdings and income data baked into the frontend store (`src/store/taxStore.js`) so you can see every visualization immediately. Replace the sample data with your own to model your real position.

## Running tests

```bash
cd backend
pytest tests/ -v
```

The test suite verifies slab tax brackets, the LTCG exemption threshold, the set-off waterfall ordering, carry-forward classification, and the Section 87A rebate boundary.

## Tax logic implemented

| Rule | Reference | Status |
|---|---|---|
| New regime slabs (0/5/10/15/20/25/30%) | Finance Act 2025 | ✅ |
| Standard deduction ₹75,000 (new regime) | Section 16(ia) | ✅ |
| Section 87A rebate (slab income ≤ ₹12L) | Section 87A | ✅ |
| LTCG equity 12.5%, ₹1.25L exemption | Section 112A | ✅ |
| STCG equity 20% | Section 111A | ✅ |
| Set-off ordering (LTCL/STCL/speculative/business) | Sections 70, 71, 73, 74 | ✅ simplified |
| Carry-forward expiry windows | Section 74 | ✅ |
| Surcharge | Finance Act | ✅ simplified, no marginal relief |
| Old regime / Section 80 deductions | — | ✅ basic support |

Simplifications are flagged in code comments inside `backend/app/services/tax_engine.py` — this is a planning aid, not a return-filing engine.

## Roadmap

- [ ] Broker statement upload (Upstox/Dhan CSV parsing) → auto-populate holdings
- [ ] 3D animated tax waterfall (Three.js)
- [ ] Candlestick charts with technical indicators per holding
- [ ] CA collaboration / sharing portal
- [ ] PDF/Excel export of tax summary
- [ ] Multi-year carry-forward planning view

## Disclaimer

This software is provided for educational and planning purposes only. It does not constitute tax, legal, or financial advice. Tax rates, exemptions, and rules change with each Union Budget — always verify figures with a qualified Chartered Accountant before filing. The maintainers accept no liability for decisions made using this tool.

## License

MIT
