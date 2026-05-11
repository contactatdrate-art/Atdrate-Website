# ATDRATE — Business Growth Consultancy

Static website for [www.atdrate.com](https://www.atdrate.com).

## Structure

```
/
├── index.html               # Homepage
├── services.html            # Our Services (four pillars)
├── insights.html            # Knowledge Center landing
├── apply.html               # Application form
├── privacy.html             # Privacy Policy
├── terms.html               # Terms of Use
├── sitemap.xml              # SEO sitemap
├── robots.txt               # Crawler rules
├── Atdrate_blacklogo.png    # Logo for white backgrounds
├── Atdrate_White Logo.png   # Logo for dark backgrounds (reserved)
├── css/
│   └── styles.css           # All site styling
├── js/
│   └── main.js              # All site JS (modal, animations, forms)
└── blog/                    # SEO-optimised insight articles
    ├── four-pillar-diagnostic-framework.html
    ├── performance-marketing-india-playbook.html
    ├── performance-marketing-fails-90-days.html
    ├── cac-ltv-ratio-founder-guide.html
    ├── hiring-first-10-employees-framework.html
    ├── performance-reviews-framework.html
    ├── hr-from-zero-90-day-plan.html
    ├── cap-table-founder-guide.html
    ├── cash-flow-forecasting-13-week-model.html
    ├── sop-documentation-framework.html
    └── operations-audit-checklist.html
```

## Local development

```bash
# Run a simple HTTP server on port 8080
python -m http.server 8080
# Then open http://localhost:8080
```

## Deployment

Pushed to GitHub → auto-deploys to Hostinger via Git integration.
After any HTML/CSS/JS edit, bump the cache-buster (`?v=N`) in HTML to force fresh fetch.

## Backend

Both the Apply form and the Welcome modal POST to a Google Apps Script Web App
that writes to a Google Sheet (Applications / Welcome tabs). URL configured in
`js/main.js`.
