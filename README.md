<div align="center">

  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/terminal.svg" width="80" height="80" style="filter: invert(60%) sepia(80%) saturate(450%) hue-rotate(115deg);" alt="OpenReady Logo" />

  <h1 align="center" style="letter-spacing: -1px; font-weight: 800;">OpenReady</h1>

  <p>
    <b>Is your repository ready for open source?</b><br />
    Audit any public GitHub repo in seconds. Get an instant readiness score, copy-paste fixes, plain-English AI explanations, and an auto-updating badge for your README.
  </p>

  <p>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/BUILT_WITH-Next.js_15-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://ai.google.dev"><img src="https://img.shields.io/badge/AI-Google_Gemini_2.5-blue?style=for-the-badge&logo=google" alt="Google Gemini" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-MIT-emerald?style=for-the-badge" alt="MIT" /></a>
    <img src="https://img.shields.io/badge/HACKTOBERFEST-2026-blueviolet?style=for-the-badge" alt="Hacktoberfest" />
  </p>

</div>

---

> [!IMPORTANT]
> **OpenReady** bridges the gap between building a project and publishing it for the world. It automates repository health checks and provides instant, copy-paste solutions for first-time maintainers.

---

## 🎯 Problem Statement
Every year, thousands of eager developers publish open-source projects without a license, clear installation steps, or a contributing guide.
- 🚫 **Without a license:** Nobody is legally permitted to use, modify, or distribute the code.
- 📉 **Without documentation:** Potential contributors abandon the repository within 10 seconds.
- ⚠️ **Without .gitignore:** Sensitive API keys and credentials are accidentally exposed.

**OpenReady** is designed specifically for students and indie developers: it diagnoses repository health, explains *why* each missing file matters, and provides instant copy-paste templates.

---

## ✨ Features & Capabilities

| Feature | Description | Impact |
| :--- | :--- | :---: |
| 📊 **0–100 Readiness Score** | Evaluates 8 fundamental open-source pillars | **Clarity** |
| 📋 **1-Click Fix Guides** | Ready-to-copy templates for missing files | **Speed** |
| 🤖 **AI Mentorship (Gemini)** | Translates audit failures into friendly next steps | **Guidance** |
| 🛡️ **Secret Leak Detection** | Scans for exposed `.env` and credential files | **Security** |
| 🏷️ **Dynamic SVG Badge** | Live README badge reflecting real-time score | **Credibility** |

---

## 🛠️ Technology Stack
- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS (Modern dark developer theme)
- **AI Engine:** Google Gemini Generative AI (Gemini 2.5 Flash)
- **APIs:** GitHub REST API v3
- **Deployment:** Vercel

---

## 🏗️ Architecture
```
Browser (app/page.tsx)
   │
   ├── [POST] /api/audit    ──> lib/audit.ts   ──> GitHub REST API (Tree, Docs, Activity)
   ├── [POST] /api/explain  ──> Gemini 2.5 API ──> Beginner-Friendly Explanations
   └── [GET]  /api/badge    ──> lib/audit.ts   ──> Dynamic SVG Score Badge
```

---

## 🚀 Setup Instructions
Requirements: **Node.js 20+** installed on your system.

### 1. Clone & Install
```bash
git clone https://github.com/Engineer-Sarah/Open-Ready.git
cd Open-Ready
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Add your optional Gemini API key inside `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 💡 Usage Guide
1. **Enter Repository:** Type any GitHub repository URL or `owner/repo` (e.g. `Engineer-Sarah/Open-Ready`).
2. **Review Score:** Inspect your readiness gauge and prioritized action items.
3. **Copy Fixes:** Open *“How to fix this”* under failed checks to grab pre-configured file templates.
4. **AI Mentorship:** Click **“✨ Explain in simple words (AI)”** for prioritized advice.
5. **Show Off Badge:** Copy the generated SVG badge directly into your README.

---

## 🤖 Kiro Usage (Hackathon Track)
**Kiro** was used as our development companion during the Hacktoberfest Hackathon NUST x NSTP:
- **System Architecture:** Designing the 8-pillar audit model and API routing hierarchy.
- **Workflow Acceleration:** Rapid scaffolding of TypeScript types and fix templates.
- **Error Handling:** Formulating fallback pipelines for the Google Gemini integration.

---

## 👥 Team Contributions
Solo project built by **Sarah Abrar** ([@Engineer-Sarah](https://github.com/Engineer-Sarah)) for the **Hacktoberfest Hackathon NUST x NSTP**:
- Conceptualization, system architecture, UI/UX design, full-stack implementation, and technical documentation.

---

## 📜 License
Released under the permissive [MIT License](LICENSE).

---

## 🙏 Acknowledgements
- **AWS Student Builder Group NUST & Hacktoberfest**
- **Next.js & Vercel**
- **Google AI Studio**