# OpenReady

Is your repository ready for open source? Paste any public GitHub repo and OpenReady gives you an instant 0-100 readiness score, copy-paste fixes, plain-English AI explanations (Gemini 2.5), and an auto-updating badge for your README.

## Problem Statement
Many new open-source projects are published without a license, a useful README, or a contributing guide. Without a license nobody is legally allowed to use the code, and without onboarding documentation newcomers cannot contribute. Existing audit tools are complex and written for DevOps experts. OpenReady is built for students and first-time maintainers: it tells you exactly what is missing, why it matters, and how to fix it in seconds.

## Solution and Features
- Readiness Score (0-100) from 8 fundamental open-source checks.
- One-Click Fix Guides with ready-to-copy code templates.
- AI Mentorship powered by Google Gemini to guide beginners.
- Dynamic README Badge that updates live.
- Shareable Reports via URL parameters.

## Technology Stack
- Next.js (App Router), React 19, TypeScript
- Tailwind CSS
- GitHub REST API
- Google Gemini API

## Architecture
Browser to Next.js API Routes to GitHub API and Google Gemini API.

## Setup Instructions
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

## Usage
1. Open the app and paste any public GitHub repository link.
2. Review the score and the prioritized failed checks.
3. Click Explain in simple words (AI) for a friendly summary.
4. Copy the SVG badge markdown into your README.

## Kiro Usage
Kiro was used as our development companion during the Hacktoberfest Hackathon NUST x NSTP:
- Architecture and system design for the 8 open-source checks.
- Workflow acceleration and prompt engineering for Gemini.
- Debugging model migration edge-cases.

## Team Contributions
Solo project built for Hacktoberfest Hackathon NUST x NSTP:
- Sarah Abrar (@Engineer-Sarah): Concept, architecture, implementation, and documentation.

## License
Released under the MIT License.

## Acknowledgements
- AWS Student Builder Group NUST and Hacktoberfest
- Next.js, React, Tailwind CSS, Google Gemini, GitHub API