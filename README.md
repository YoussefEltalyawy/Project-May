# Project May 


**Project May** is a specialized web application designed to automatically generate standard 10-section Safety Data Sheets (SDS) for chemical compounds. 

## 📖 The Story Behind Project May

I initially built this website to help my mom. She is a chemist and needed to create Safety Data Sheets for dozens of compounds manually, which meant dealing with Microsoft Word—a tedious and frustrating process. I decided to build a tool that would automate the heavy lifting for her. 

The name **"Project May"** stems from her birthday, which is in May. 

## ✨ Features

- **Standardized SDS Generation:** Automatically creates a standard 16-section Safety Data Sheet for chemical compounds, strictly ordered to comply with global regulations.
- **AI-Powered Summarization:** Integrates the Google Gemini API to parse, summarize, and clean up dense, repetitive data directly from the PubChem PUG-View API, making it concise and professional.
- **Smart Data Caching:** Employs a dual-caching strategy (localStorage & Neon Postgres Database) to minimize external API calls, resulting in lightning-fast response times for previously queried compounds.
- **High-Quality PDF Exports:** Uses `@react-pdf/renderer` to produce clean, Swiss-style PDF documents containing embedded Base64 GHS hazard pictograms to guarantee reliable rendering anywhere.
- **International Safety Focus:** Includes specialized features such as high-visibility Arabic safety warnings specifically tailored for lab workers in her environment.
- **Sleek & Premium UI:** A refined, distraction-free interface prioritizing ease of use, so generating an SDS is as simple as searching for the compound and clicking "Export."

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Data Source:** [PubChem API](https://pubchem.ncbi.nlm.nih.gov/)
- **AI Integration:** [Google Gemini API](https://deepmind.google/technologies/gemini/)
- **Database:** [Neon (Serverless Postgres)](https://neon.tech/)
- **PDF Rendering:** [`@react-pdf/renderer`](https://react-pdf.org/)


---
*Built with ❤️ for my mom.*
