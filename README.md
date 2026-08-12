# Ice IQ - Hockey Analytics Platform

A modern React application for hockey player analytics, scouting, and performance tracking.

## 🚀 Features

- **Player Performance Tracking**: Record and analyze player actions during games
- **Advanced Statistics**: Detailed analytics and visualizations
- **Multi-language Support**: English and Swedish
- **Real-time Cloud Sync**: Firebase integration for data persistence
- **Subscription Model**: Freemium with Premium features
- **Responsive Design**: Mobile-first approach with PWA support
- **Secure Payments**: Stripe integration for subscription management

## 🏗️ Project Structure
iceiq-react/
├── public/ # Static assets
├── src/
│ ├── components/ # React components
│ ├── contexts/ # React Context providers
│ ├── hooks/ # Custom React hooks
│ ├── pages/ # Page components
│ ├── services/ # External service integrations
│ ├── utils/ # Utility functions
│ ├── types/ # TypeScript type definitions
│ └── App.tsx # Main application component


## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication
- Stripe account for payments

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd iceiq-react
```

2. Install dependencies:
```bash
npm install
```

3. Create your local environment file by copying the example and filling in your Firebase and Stripe keys:
```bash
cp .env.example .env
```
The `.env` file is git-ignored and must never be committed.

4. Start the dev server:
```bash
npm run dev
```

## 📬 Transactional email (Resend)

Two Cloud Functions send email via [Resend](https://resend.com):

- `sendWelcomeEmail` — Firestore trigger on `artifacts/{appId}/users/{userId}`
  creation. Fires once per new account, in the user's language.
- `weeklyDigest` — scheduled Mondays 08:00 Europe/Stockholm, summarizes the
  past week's games per player. Users can opt out via **My Account**
  (`emailDigest: false` on the user document). Skipped entirely for users
  with no games that week.

Requirements:
1. Set the `RESEND_API_KEY` secret: `firebase functions:secrets:set RESEND_API_KEY`
2. The sending domain is set in `FROM_EMAIL` in `functions/index.js`. It
   currently sends from `squareversegroup.com` (already verified in Resend)
   — swap to an `iceiq.app` address once that domain is added and verified
   there.
3. Deploy functions: `firebase deploy --only functions`
