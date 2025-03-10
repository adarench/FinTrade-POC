# FinTrade - High-Frequency Copy Trading Platform

A proof-of-concept web application that simulates a high-frequency copy trading platform with fake data. Users can select and follow traders, view trade histories, and automatically copy trades in a simulated environment.

## Features

- Real-time trade feed with WebSockets
- Trader profiles with performance metrics
- Leaderboard based on trader performance
- Portfolio tracking
- Auto-copy trading functionality
- Responsive UI for desktop and mobile

## Tech Stack

- **Frontend**: React (Next.js), TypeScript, Tailwind CSS
- **Backend**: Node.js (Express), Socket.io
- **Data**: Mock data (no real trading)
- **Deployment**: Docker for easy setup

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (optional, for containerized deployment)

### Run in Development Mode

#### Backend

```bash
cd server
npm install
npm run dev
```

#### Frontend

```bash
cd client
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Run with Docker

For a production-like environment, use Docker Compose:

```bash
docker-compose up
```

The application will be available at the same addresses as development mode.

## Project Structure

```
FinTrade/
├── client/               # Frontend code (Next.js)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # Context providers
│   │   ├── pages/        # Next.js pages
│   │   ├── styles/       # CSS styles
│   │   ├── types/        # TypeScript definitions
│   │   └── utils/        # Utility functions
│   └── ...
├── server/               # Backend code (Express)
│   ├── src/
│   │   ├── data/         # Mock data
│   │   ├── routes/       # API endpoints
│   │   └── index.js      # Server entry point
│   └── ...
└── docker-compose.yml    # Docker Compose configuration
```

## Functionality

1. **User Dashboard**
   - View a list of traders with performance metrics
   - Follow/unfollow traders
   - View real-time trade feed (simulated)

2. **Trade Mirroring (Simulated)**
   - Trades from followed traders appear in your feed
   - Auto-copy functionality to replicate trades
   - Configure copy amounts per trade

3. **Portfolio Management**
   - View your current holdings
   - Track performance over time
   - See trade history

4. **Leaderboard**
   - Rank traders by performance
   - Sort by different metrics (return, win rate, etc.)

## Disclaimer

This is a proof-of-concept application designed for demonstration purposes only. It does not perform any real trading and all data is simulated. The application is not financial advice, and in a real-world scenario would require proper regulatory compliance, security measures, and risk management systems.

## License

MIT