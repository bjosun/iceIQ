import { BrainCircuit, BarChart3, Cloud, Zap } from 'lucide-react';
import LandingPage from './LandingPage';

export default function HockeyTrackingApp() {
  return (
    <LandingPage
      path="/hockey-tracking-app"
      seoTitle="Hockey Tracking App with an AI Coach | Ice IQ"
      seoDescription="Ice IQ is a hockey tracking app for parents, players, and coaches. Log a game in a couple of minutes and get concrete, AI-generated advice on what to work on next. Free to start."
      badge="Hockey Tracking App"
      h1={
        <>
          The Hockey Tracking App That Tells You{' '}
          <span className="text-primary-400">What to Work On Next</span>
        </>
      }
      intro="Most hockey tracking apps stop at a scoresheet. Ice IQ logs a game in a couple of minutes, then its AI coach turns that stat line into specific, tactical advice — for parents watching from the stands, players who want a plan, and coaches who don't have time to build one after every game."
      features={[
        {
          icon: Zap,
          title: 'Log a Game in Minutes',
          description: 'A simple action grid for goals, assists, shots, and more — built to use rinkside, not at a desk after the fact.',
        },
        {
          icon: BrainCircuit,
          title: 'AI Coach Feedback',
          description: 'After every logged game, the AI coach reads the stats and gives tactical, specific advice instead of a raw number dump.',
        },
        {
          icon: BarChart3,
          title: 'Stats That Show Progress',
          description: 'Track performance across a season and see development over time, not just one game in isolation.',
        },
        {
          icon: Cloud,
          title: 'Synced Everywhere',
          description: 'Log from a phone at the rink and review from any device afterward — everything is backed up automatically.',
        },
      ]}
      faqs={[
        {
          question: 'What can I track in Ice IQ?',
          answer: 'Game actions like goals, assists, shots on goal, and more, plus season-level stats built from every logged game.',
        },
        {
          question: 'Is it built for youth hockey?',
          answer: 'Yes — Ice IQ is built for hockey parents, players, and coaches at every level, from grassroots youth hockey to competitive teams.',
        },
        {
          question: 'Do I need a spreadsheet or a separate scoresheet?',
          answer: 'No. Logging happens directly in the app during or right after the game, and the stats and AI feedback are generated automatically.',
        },
        {
          question: 'Is Ice IQ free?',
          answer: 'Yes. The free plan includes up to 3 saved players, match scoring, match history, and a few AI credits per month.',
        },
      ]}
      ctaHeading="Try the Hockey Tracking App Free"
      ctaDesc="Log your first game in a couple of minutes and see what the AI coach has to say about it."
    />
  );
}
