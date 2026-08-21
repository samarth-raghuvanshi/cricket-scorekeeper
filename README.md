# Cricket Scorekeeper

A modern, full-stack web application for tracking cricket match scores in real-time. Built with React, TypeScript, and Node.js.

## Features

- **Real-time Score Tracking** - Update scores, wickets, and match details instantly
- **Score Progress Charts** - Visualize match progression with interactive charts
- **Player Management** - Add and manage players for each match
- **Match History** - Keep a record of all completed matches
- **Secure Scoring** - Scorer keys for secure match access and updates
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Modern UI** - Built with React and Tailwind CSS for a polished experience

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **PostgreSQL** - Robust relational database (via Supabase)
- **Native HTTP Server** - Built with Node.js `http` module
- **pg** - PostgreSQL client library

## Project Structure

```
cricket-scorekeeper/
├── web/                          # Frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── navbar.tsx
│   │   │   ├── PlayerSelector.tsx
│   │   │   ├── ScoreBoard.tsx
│   │   │   ├── Scorecard.tsx
│   │   │   ├── ScoreProgressChart.tsx
│   │   │   └── ScoringControls.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── landing.tsx
│   │   │   ├── creatematch.tsx
│   │   │   ├── match.tsx
│   │   │   ├── history.tsx
│   │   │   └── about.tsx
│   │   ├── lib/                  # Utility functions
│   │   │   ├── api.ts           # API client
│   │   │   ├── match.ts         # Match logic
│   │   │   └── scoring.ts       # Scoring logic
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # Entry point
│   ├── public/                  # Static assets
│   └── vite.config.ts          # Vite configuration
├── server/
│   └── index.mjs               # Express-like HTTP server
├── scripts/
│   └── dev.mjs                 # Development script
├── .env.example               # Environment variables template
├── package.json               # Root dependencies
└── tsconfig.json             # TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cricket-scorekeeper.git
cd cricket-scorekeeper
```

2. Install dependencies:
```bash
npm install
```

3. Install web dependencies:
```bash
npm --prefix web install
```

4. Set up environment variables:
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Supabase PostgreSQL connection string.

### Development

Start the development environment with both frontend and backend:
```bash
npm run dev
```

This will:
- Start the Vite dev server (Frontend on port 5173)
- Start the Node.js backend server (API on port 3002)

### Building

Build the frontend for production:
```bash
npm run build
```

This creates an optimized build in `web/dist/`.

### Running

**Development mode:**
```bash
npm run dev
```

**Backend API only:**
```bash
npm run api
```

**Frontend dev server:**
```bash
npm --prefix web run dev
```

**Preview production build:**
```bash
npm --prefix web run preview
```


**Happy scoring! 🏏**
