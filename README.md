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

## 📬 Weekly email digest

The `weeklyDigest` Cloud Function (Mondays 08:00 Europe/Stockholm) queues a
summary email for every user with games logged in the past week, by writing
documents to the `mail` collection.

Requirements:
1. Install the **Trigger Email from Firestore** extension
   (`firebase ext:install firebase/firestore-send-email`) configured with the
   `mail` collection and your SMTP provider.
2. Deploy functions: `firebase deploy --only functions`

Users can opt out via the toggle under **My Account** in the app
(`emailDigest: false` on the user document). Emails are only queued for users
with at least one game in the past 7 days.
