import { Zap, BarChart3, Users, Cloud } from 'lucide-react';
import LandingPage from './LandingPage';

export default function HockeyScoutingTemplate() {
  return (
    <LandingPage
      path="/hockey-scouting-template"
      seoTitle="Hockey Scouting & Player Evaluation Without a Spreadsheet | Ice IQ"
      seoDescription="Skip the hockey scouting spreadsheet template. Ice IQ logs shots, goals, assists, and more per player during the game, and organizes it into stats automatically — no manual template to maintain."
      badge="Hockey Scouting & Evaluation"
      h1={
        <>
          Skip the Scouting Template —{' '}
          <span className="text-primary-400">Log It Straight to Stats</span>
        </>
      }
      intro="A scouting or evaluation template is really just a way to structure what you write down during a game. Ice IQ does that structuring for you: log a player's actions — shots on goal, blocked shots, goals, assists — as they happen, and it's organized into season stats automatically, no spreadsheet to build or maintain."
      features={[
        {
          icon: Zap,
          title: 'Log During the Game',
          description: 'A tap-based action grid replaces a paper or spreadsheet template — built to use rinkside, not typed up afterward.',
        },
        {
          icon: BarChart3,
          title: 'Structured Automatically',
          description: 'Every logged action feeds directly into per-player and season stats — no manual tallying or formulas to keep straight.',
        },
        {
          icon: Users,
          title: 'One Player or a Full Roster',
          description: 'Evaluate a single player you\'re following or manage multiple players and teams from one account.',
        },
        {
          icon: Cloud,
          title: 'Always Backed Up',
          description: 'Everything syncs to the cloud automatically — no lost spreadsheet, no version confusion between devices.',
        },
      ]}
      faqs={[
        {
          question: 'Is there a downloadable scouting template?',
          answer: 'No — Ice IQ replaces the template itself. Instead of filling in a spreadsheet, you log actions directly in the app and it builds the structured stats for you.',
        },
        {
          question: 'What can I log for evaluation purposes?',
          answer: 'Actions like shots on goal, missed shots, blocked shots, goals, and assists, tracked per player and rolled into season history.',
        },
        {
          question: 'Can I evaluate more than one player?',
          answer: 'Yes. Team management supports tracking multiple players or a full roster from a single account.',
        },
        {
          question: 'Is this meant for coaches or for parents?',
          answer: 'Both. It\'s built for hockey parents, players, and coaches who want structured game data without doing paperwork after every game.',
        },
      ]}
      ctaHeading="Try It Instead of a Spreadsheet"
      ctaDesc="Log your first game in a couple of minutes and see the stats build themselves."
    />
  );
}
