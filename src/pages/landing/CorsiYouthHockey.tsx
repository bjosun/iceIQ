import { Zap, BarChart3, BrainCircuit, Users } from 'lucide-react';
import LandingPage from './LandingPage';

export default function CorsiYouthHockey() {
  return (
    <LandingPage
      path="/measure-corsi-youth-hockey"
      seoTitle="Measuring Shot Attempts (Corsi) for Youth Hockey Players | Ice IQ"
      seoDescription="Corsi is built for the NHL, not a 10U roster. Ice IQ tracks the building blocks — shots on goal, missed shots, and blocked shots — per youth player, without the pro-level jargon."
      badge="Shot-Attempt Stats"
      h1={
        <>
          You Don't Need Full Corsi to{' '}
          <span className="text-primary-400">Track Shot Attempts</span>
        </>
      }
      intro="Corsi — a team's shot-attempt differential at 5-on-5 — is an NHL analytics stat, built for a level where every shift and matchup is tracked by a full staff. At the youth level, chasing the exact pro-style number usually isn't worth the overhead. What actually helps a parent or coach is simpler: how many shots is this player getting on net, missing, or having blocked, game after game. Ice IQ tracks exactly that, per player, without a stopwatch or a spreadsheet."
      features={[
        {
          icon: Zap,
          title: 'Shot-by-Shot Logging',
          description: 'Log shots on goal and missed shots as the game happens, and add an action for blocked attempts with a custom template — the same raw actions Corsi is built from.',
        },
        {
          icon: BarChart3,
          title: 'Per-Player, Per-Game',
          description: 'See shot activity broken down by game and rolled up across a season, instead of one aggregate team number.',
        },
        {
          icon: BrainCircuit,
          title: 'AI Coach Turns It Into Advice',
          description: 'Rather than a raw shot-attempt percentage, the AI coach explains what the numbers actually mean for that player\'s next game.',
        },
        {
          icon: Users,
          title: 'Built for Youth Rosters',
          description: 'No dedicated stats staff required — one parent, player, or coach can log a full roster from their phone.',
        },
      ]}
      faqs={[
        {
          question: 'What is Corsi, in plain terms?',
          answer: 'It\'s a shot-attempt differential — shots on goal, missed shots, and blocked shots for a team versus against — used in the NHL as a rough proxy for puck possession.',
        },
        {
          question: 'Does Ice IQ calculate an official Corsi rating?',
          answer: 'No. Ice IQ tracks the underlying actions per player — shots on goal and missed shots out of the box, plus blocked attempts if you add them to a custom template — which is the practical, youth-level version of what Corsi measures at the team level.',
        },
        {
          question: 'Why not just track full team Corsi at the youth level?',
          answer: 'It requires tracking every shot attempt for both teams at 5-on-5, which needs a dedicated tracker per game. Per-player shot logging gives a parent or coach useful signal without that overhead.',
        },
        {
          question: 'Is this useful without an analytics background?',
          answer: 'Yes — that\'s the point. The AI coach explains what the logged shots mean instead of leaving you to interpret a raw stat.',
        },
      ]}
      ctaHeading="Start Logging Shot Attempts, Simply"
      ctaDesc="Log your first game and see per-player shot stats build up automatically — no analytics background required."
    />
  );
}
