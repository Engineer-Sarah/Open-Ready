// Beginner-friendly fixes shown under each failed check.
// "body" is a ready-to-copy template (optional).

export type Fix = { steps: string; file?: string; body?: string };

export const FIXES: Record<string, Fix> = {
  license: {
    file: "LICENSE",
    steps:
      "Create a file named LICENSE in the repo root and paste the text below. Replace the year and name. On GitHub: Add file > Create new file > type LICENSE > Choose a license template.",
    body: `MIT License

Copyright (c) <year> <your name>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  },
  readme: {
    file: "README.md",
    steps: "Create README.md in the repo root and start from this skeleton.",
    body: `# Project Name

One or two sentences: what it does and who it is for.

## Features
- Feature one
- Feature two

## Setup
1. Clone the repository
2. Install dependencies
3. Run the project

## Usage
Show a short example of how to use it.

## License
This project is licensed under the MIT License. See the LICENSE file.
`,
  },
  "readme-sections": {
    file: "README.md",
    steps: "Add these headings to your README (edit the text under each one).",
    body: `## Setup
1. Clone the repository
2. Install dependencies
3. Run the project

## Usage
Show a short example of how to use it.

## License
This project is licensed under the MIT License. See the LICENSE file.
`,
  },
  contributing: {
    file: "CONTRIBUTING.md",
    steps: "Create CONTRIBUTING.md in the repo root so newcomers know how to help.",
    body: `# Contributing

Thanks for your interest in contributing!

## How to contribute
1. Fork the repository and create a branch for your change
2. Make your change and test it
3. Open a pull request that explains what you changed and why

## Reporting bugs
Open an issue with the steps to reproduce the problem.

## Code of conduct
Be kind and respectful to everyone.
`,
  },
  gitignore: {
    file: ".gitignore",
    steps: "Create .gitignore in the repo root (this one suits Node.js projects).",
    body: `node_modules/
.next/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
`,
  },
  secrets: {
    file: ".gitignore",
    steps:
      "Remove the file from the repo (git rm --cached <file>), add it to .gitignore, and rotate any key that was exposed. Deleting it later is not enough: assume the secret is already compromised.",
    body: `.env
.env.*
!.env.example
*.pem
`,
  },
  metadata: {
    steps: "On the repo page, click the gear icon next to About. Add a one-line description and 3 to 6 topics.",
  },
  activity: {
    steps: "Push a small improvement, such as updating the README or fixing an issue, so the project shows signs of life.",
  },
};
