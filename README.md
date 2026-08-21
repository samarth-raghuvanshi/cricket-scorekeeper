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

## API Endpoints

The backend provides RESTful endpoints for match management and scoring.

### Endpoints:
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create a new match
- `GET /api/matches/:id` - Get a specific match
- `PUT /api/matches/:id` - Update a match (requires scorer key)
- `DELETE /api/matches/:id` - Delete a match (admin only)
- `GET /api/matches/events` - Server-sent events for match history
- `GET /api/matches/:id/events` - Server-sent events for specific match
- `POST /api/matches/:id/scorer-session` - Validate scorer key

### Key Features:
- Real-time score updates via Server-Sent Events (SSE)
- Secure scorer key authentication
- Admin-only deletion with admin key
- Automatic deletion of matches older than 7 days

## Database

The application uses **PostgreSQL** for data persistence (hosted on Supabase). The database schema is automatically initialized on first server run.

### Tables:
- **matches** - Stores match information and state
  - `id` - UUID primary key
  - `state` - JSONB column for match state data
  - `scorer_key` - Hashed scorer key for match access control
  - `created_at` - Match creation timestamp (auto-set)
  - `updated_at` - Last update timestamp (auto-updated)

### Indexes:
- `idx_matches_updated_at` - Index on `updated_at DESC` for efficient history queries

## Environment Variables

Configure the backend with these environment variables (see `.env.example`):

```bash
DATABASE_URL=postgresql://user:password@host:5432/database  # PostgreSQL connection string from Supabase
PORT=3002                                                     # Backend server port (default: 3002)
NODE_ENV=development                                          # Set to 'production' for Supabase deployment
ADMIN_KEY=change-me                                          # Admin authentication key (change in production)
```

## Deployment with Supabase

### Prerequisites
- Supabase account (free tier available at https://supabase.com)
- Node.js runtime (Vercel, Render, Railway, or similar)

### Step-by-Step Deployment

1. **Create a Supabase Project**
   - Go to [Supabase](https://supabase.com) and sign in
   - Click "New Project"
   - Choose your organization and region
   - Set a secure database password
   - Wait for the project to initialize

2. **Get Your Database Connection String**
   - In Supabase dashboard, go to **Settings > Database > Connection String**
   - Select "Node.js" from the dropdown
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual database password

3. **Deploy Backend to Vercel/Render/Railway**

   **Using Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy (follows prompts)
   vercel
   ```
   
   Then set environment variable in Vercel dashboard:
   - Add `DATABASE_URL` with your Supabase connection string
   - Add `ADMIN_KEY` with a secure random string
   - Set `NODE_ENV=production`

   **Using Render:**
   - Push code to GitHub
   - Create new Web Service on Render
   - Connect to your repository
   - Set environment variables in Render dashboard
   - Deploy

4. **Deploy Frontend**
   ```bash
   npm run build  # Build the frontend
   ```
   
   - Upload the built files from `web/dist/` to Vercel, Netlify, or similar
   - Update API endpoint in frontend to point to your deployed backend

### Database Initialization

The database schema is automatically created when the server starts for the first time. No manual migration needed!

The application will:
1. Create the `matches` table with proper schema
2. Create the `idx_matches_updated_at` index
3. Start the hourly cleanup job for expired matches

## Code Quality

### Linting
```bash
npm --prefix web run lint
```

### Type Checking
TypeScript is configured for strict type checking across the project.

## Features Breakdown

### Landing Page
- Welcome screen with navigation to create matches or view history

### Create Match
- Form to initialize a new cricket match
- Player selection and setup

### Match Page
- Live scoreboard display
- Score input controls
- Player selector
- Real-time score progression chart

### History
- View all completed matches
- Match statistics and results

### About
- Application information and documentation

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Database Connection Issues

**Error: "connect ECONNREFUSED"**
- Verify your `DATABASE_URL` is correct in `.env.local` or environment variables
- Check that Supabase project is active and running
- Ensure your IP is whitelisted in Supabase (if using restricted IPs)

**Error: "password authentication failed"**
- Double-check the password in your connection string
- Reset the database password in Supabase if needed

### Port Already in Use
If port 3002 is already in use, set a different port:
```bash
PORT=3003 npm run api
```

### Module Not Found Errors
Reinstall dependencies:
```bash
npm install
npm --prefix web install
```

### API Connection Errors in Frontend

If the frontend can't connect to the backend:
1. Check that the backend is running
2. Verify the API endpoint in your frontend code matches the backend URL
3. Check CORS headers (backend allows all origins by default)

## Support

For issues, questions, or suggestions, please create an issue on the GitHub repository.

---

**Happy scoring! 🏏**
