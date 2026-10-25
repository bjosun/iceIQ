import { BrainCircuit, MessageCircleQuestion, TrendingUp, Smartphone } from 'lucide-react';
import LandingPage from './LandingPage';

export default function HockeyIqApp() {
  return (
    <LandingPage
      path="/hockey-iq-app"
      seoTitle="Hockey IQ App Built on Your Own Games | Ice IQ"
      seoDescription="Most hockey IQ apps train decisions in made-up situations. Ice IQ shows how a player's decisions play out in their real games, with an AI coach and one thing to work on next. Free to start."
      badge="Hockey IQ App"
      h1={
        <>
          A Hockey IQ App Built on{' '}
          <span className="text-primary-400">the Player's Own Games</span>
        </>
      }
      intro="Most hockey IQ apps train decisions in situations made for the app: quizzes, video clips, or game-like drills. Ice IQ starts somewhere else. You log what the player actually did in a real game in under two minutes, and the AI coach shows which choices keep repeating and what to work on next."
      features={[
        {
          icon: TrendingUp,
          title: 'Compared With Themselves',
          description: "Every game is measured against the player's own recent games and season average, never against other kids.",
        },
        {
          icon: BrainCircuit,
          title: 'One Thing to Work On',
          description: 'After each game the AI coach gives a trend, strengths, and one focus area, backed by the numbers from that game.',
        },
        {
          icon: MessageCircleQuestion,
          title: 'A Question About a Decision',
          description: 'The coach also leaves one calm question to think about, like what the player saw just before a turnover.',
        },
        {
          icon: Smartphone,
          title: "On the Player's Own Phone",
          description: 'A player link with no login shows progress, the coach notes, and a breathing exercise. The parent can switch it off at any time.',
        },
      ]}
      faqs={[
        {
          question: 'What is hockey IQ?',
          answer: "A player's ability to read the game, make quick decisions, and position themselves well on the ice. Scenario apps train it in made-up situations. Ice IQ shows how those decisions actually play out in the player's own games.",
        },
        {
          question: 'Is Ice IQ a hockey IQ training app like Project Hockey or RinkIQ?',
          answer: "No, it complements them. Those apps train decisions with quizzes, clips, or drills. Ice IQ tracks the player's real games and gives AI feedback on what to work on next.",
        },
        {
          question: 'Can I use Ice IQ together with a scenario app?',
          answer: 'Yes. Train situations in a scenario app, then log games in Ice IQ to see whether the same decisions start showing up on the ice.',
        },
        {
          question: 'How long does logging a game take?',
          answer: 'Under two minutes, by tapping buttons for what happened during or right after the game.',
        },
        {
          question: 'Is Ice IQ the same as IceIQ Development?',
          answer: 'No. Ice IQ (iceiq.app, by SquareVerse Group AB) is not affiliated with IceIQ Development or other services with similar names.',
        },
        {
          question: 'Is Ice IQ free?',
          answer: 'Yes. The free plan includes up to 3 saved players, game scoring, game history, and 3 AI credits per month. Premium and Elite add more players, cloud sync, and more AI credits.',
        },
      ]}
      ctaHeading="See What Your Player's Games Say"
      ctaDesc="Log your next game in under two minutes and get one concrete thing to work on. Free, no card required."
    />
  );
}
