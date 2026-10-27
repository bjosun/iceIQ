import { ClipboardList, UserCheck, Gauge, Target } from 'lucide-react';
import LandingPage from './LandingPage';
import preview from '../../assets/images/player-evaluation-template-preview-en.png';

// Ungated lead magnet, like /game-tracking-template, but English-only: it
// targets the "hockey player evaluation" / "tryout evaluation sheet" searches,
// which come almost entirely from North America. PDF source and build script
// live in marketing/lead-magnets/tryout-evaluation-template/.
export default function PlayerEvaluationTemplate() {
  return (
    <LandingPage
      path="/hockey-player-evaluation-template"
      seoTitle="Free Hockey Player Evaluation Template & Tryout Sheet (PDF) | Ice IQ"
      seoDescription="Download a free, printable hockey player evaluation template: a tryout evaluation sheet for a whole group and a one-player evaluation form, with a clear 1–5 scale. No account needed."
      badge="Free Download"
      h1={
        <>
          Free Hockey Player Evaluation Template{' '}
          <span className="text-primary-400">and Tryout Sheet</span>
        </>
      }
      intro="Two printable pages, no account needed. A tryout evaluation sheet for rating a whole group by skill, and a player evaluation form for one player at tryouts, mid-season, or the end of the season."
      download={{
        href: '/downloads/ice-iq-player-evaluation-template-en.pdf',
        text: 'Download the free PDF',
        note: 'Two pages · PDF · US Letter, prints fine on A4',
      }}
      preview={{ src: preview, alt: 'Preview of the Ice IQ hockey tryout evaluation sheet' }}
      features={[
        {
          icon: ClipboardList,
          title: 'Tryout Evaluation Sheet',
          description: 'Rate up to 18 skaters on skating, puck skills, passing, shooting, hockey sense, and compete, with a total out of 30 and room for notes.',
        },
        {
          icon: UserCheck,
          title: 'One-Player Evaluation Form',
          description: 'Eight skills with a short description each, a rating, and space for what you actually saw, plus one strength and one thing to work on.',
        },
        {
          icon: Gauge,
          title: 'A Clear 1–5 Scale',
          description: 'From "well below the group" to "stands out", so several evaluators rate the same way and players are compared with their own age group.',
        },
        {
          icon: Target,
          title: 'Built for Feedback, Not Just Cuts',
          description: 'The form ends with one strength and one thing to work on, the two things a young player can actually take with them.',
        },
      ]}
      faqs={[
        {
          question: 'What should a hockey player evaluation include?',
          answer: 'For skaters: skating, puck handling, passing and receiving, shooting, hockey sense, defensive play, compete, and coachability. Rate each on a fixed scale and write down what you saw, so the rating can be explained to the player and parents.',
        },
        {
          question: 'How do you run evaluations at hockey tryouts?',
          answer: 'Split players into groups, give each evaluator one sheet per group or station, and rate against the age group rather than older players. Use more than one evaluator and more than one session, and compare totals only after every session is done.',
        },
        {
          question: 'Is the template free?',
          answer: 'Yes. It is a free PDF with no account or email required. Print as many copies as you need.',
        },
        {
          question: 'Does it work for goalies?',
          answer: 'The sheets are built for skaters. Goalies need different criteria, such as positioning, rebound control, and tracking the puck, so evaluate them separately.',
        },
        {
          question: 'How can I follow a player after the evaluation?',
          answer: "An evaluation shows where a player is on one day. Ice IQ logs each game in under two minutes and compares the player with their own season average, so you can see whether the thing they are working on actually improves.",
        },
      ]}
      ctaHeading="Follow Development After Tryouts"
      ctaDesc="Log games in under two minutes and get one concrete thing to work on after each one. Free to start, no card required."
    />
  );
}
