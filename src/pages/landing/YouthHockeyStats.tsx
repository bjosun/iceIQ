import { BarChart3, Users, TrendingUp, Wind } from 'lucide-react';
import LandingPage from './LandingPage';

export default function YouthHockeyStats() {
  return (
    <LandingPage
      path="/youth-hockey-stats"
      seoTitle="Youth Hockey Stats Tracking App | Ice IQ"
      seoDescription="Track youth hockey stats game by game with Ice IQ. See player development over a season, manage multiple kids or a full team, and get AI feedback after every game. Free to start."
      badge="Youth Hockey Stats"
      h1={
        <>
          Youth Hockey Stats, Tracked{' '}
          <span className="text-primary-400">Game by Game</span>
        </>
      }
      intro="A single good game doesn't tell you much about a young player's development — a season of logged games does. Ice IQ tracks youth hockey stats after every game and turns them into a clear picture of what's actually improving, for one player or a whole roster."
      features={[
        {
          icon: BarChart3,
          title: 'Season-Long Tracking',
          description: 'Every logged game rolls into season stats, so progress is visible across months, not just one outing.',
        },
        {
          icon: Users,
          title: 'Manage Multiple Players',
          description: 'Track more than one child or a full team roster from a single account, without juggling separate spreadsheets.',
        },
        {
          icon: TrendingUp,
          title: 'See What\'s Actually Improving',
          description: 'The AI coach turns raw game stats into specific, tactical feedback a young player can act on.',
        },
        {
          icon: Wind,
          title: 'Mental Training, Too',
          description: 'Short pre-game routines that help young players prepare and stay calm — free for everyone.',
        },
      ]}
      faqs={[
        {
          question: 'How many players can I track?',
          answer: 'The free plan includes up to 3 saved players. Premium and Elite plans support more players and teams.',
        },
        {
          question: 'What stats does Ice IQ track for youth players?',
          answer: 'Game actions like goals, assists, and shots on goal, rolled up into season history and averages for each player.',
        },
        {
          question: 'Is this just for competitive teams?',
          answer: 'No — Ice IQ is built for every level, from grassroots youth hockey where kids are still learning the game to competitive travel teams.',
        },
        {
          question: 'Can a coach use this for the whole team?',
          answer: 'Yes. Team management lets a coach or stats-minded parent track multiple players under one account.',
        },
      ]}
      ctaHeading="Start Tracking Youth Hockey Stats Free"
      ctaDesc="Log your first game and start building a real season history — for one player or the whole team."
    />
  );
}
