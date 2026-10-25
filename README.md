# 🚀 OpenReady

Is your repository ready for open source? Paste any public GitHub repo and OpenReady gives you an instant 0-100 readiness score, copy-paste fixes, plain-English AI explanations, and an auto-updating badge for your README.

---

## 🎯 Problem Statement
Every year, thousands of eager developers publish open-source projects without a license, clear installation steps, or a contributing guide. OpenReady is designed specifically for students, indie developers, and first-time maintainers: it diagnoses repository health, explains why each missing file matters, and provides instant copy-paste solutions.

---

## ✨ Features
- Readiness Score (0-100) from 8 fundamental open-source checks.
- Ready-to-Copy Fix Guides for missing repository files.
- AI Mentor powered by Google Gemini to guide beginners.
- Dynamic README Badge that updates live with score changes.
- Shareable Reports via URL parameters.

---

## 🛠️ Technology Stack
- Next.js (App Router), React 19, TypeScript
- Tailwind CSS
- Google Gemini API
- GitHub REST API v3
- Vercel Deployment

---

## 🏗️ Architecture
Browser (app/page.tsx) -> Next.js API Routes -> GitHub REST API and Google Gemini API

---

## 🚀 Setup Instructions
Requirements: Node.js 20 or newer.

1. Clone the repository:
git clone https://github.com/Engineer-Sarah/Open-Ready.git
cd Open-Ready

2. Install dependencies:
npm install

3. Configure environment variables in .env.local:
GEMINI_API_KEY=your_key_here

4. Start development server:
npm run dev

Open http://localhost:3000 in your browser.

---

## 💡 Usage Guide
1. Open the app and paste any public GitHub repository link.
2. Review the score and the prioritized failed checks.
3. Click Explain in simple words (AI) for a friendly summary of next steps.
4. Copy the SVG badge markdown into your README.

---

## 🤖 Kiro Usage
Kiro was used as our development companion during the Hacktoberfest Hackathon NUST x NSTP:
- Architecture Planning: Mapping the 8 open-source audit criteria.
- Workflow Acceleration: Scaffolding types and fix templates.
- Debugging and Error Handling: Resolving model migration fallbacks.

---

## 👥 Team Contributions
Solo Project by Sarah Abrar (@Engineer-Sarah) for the Hacktoberfest Hackathon NUST x NSTP:
- Conceptualization, system architecture, full-stack implementation, UI/UX, and technical documentation.

---

## 📜 License
Released under the permissive MIT License.

---

## 🙏 Acknowledgements
- AWS Student Builder Group NUST and Hacktoberfest
- Next.js and Tailwind CSS
- Google Gemini and GitHub REST API