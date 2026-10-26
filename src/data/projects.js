import { images } from './images.js';

export const projects = [
  {
    id: 'dealer-school',
    title: 'dealers.school',
    image: images.dealerSchool,
    imageAlt: 'Dealer School banner',
    description: [
      'An LMS for an online dealer school, where students can learn table games and other casino-related areas.',
      'Connects to our in-person training center allowing students to view their on-site progression online.',
    ],
    href: 'https://dealers.school/',
    linkLabel: 'Check it out',
    external: true,
  },
  {
    id: 'fischer-random',
    title: 'A Fischer Random Chess Engine',
    image: images.fischerRandom,
    imageAlt: 'Fischer Random Chess banner',
    description: [
      'Multiple machine learning models built to evaluate and play Fischer Random Chess: a variant with randomized starting positions.',
    ],
    href: 'https://github.com/willredding314/FischerRandom',
    linkLabel: 'Check out the repository',
    linkClass: 'btn-fischer-random',
    external: true,
  },
  {
    id: 'gto-trainer',
    title: 'Game Theory Optimal Poker Trainer',
    image: images.trainer,
    imageAlt: 'GTO Poker Trainer banner',
    description: [
      'A web-based app to intake GTO pre-flop charts and run simulations based on them.',
      "Allow a user to train game theory optimal play with no subscription nor signup needed. All information is stored in the browser's local storage to allow changes to persist after refresh.",
    ],
    href: '/gto-trainer',
    linkLabel: 'Try it yourself',
    external: false,
  },
  {
    id: 'papplu',
    title: 'Papplu AI',
    image: images.papplu,
    imageAlt: 'Papplu AI card table banner',
    description: [
      'Play 21-card Papplu against AI, practice solo, or pass the device between friends. Configure up to six human or AI seats.',
      'Explore melds and minimum deadwood in Hand Builder. The game and neural model run in your browser without an account or backend.',
    ],
    href: '/papplu',
    linkLabel: 'Play Papplu',
    external: false,
  },
];
