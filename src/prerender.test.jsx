// @vitest-environment node
import { JSDOM } from 'jsdom';
import { expect, test } from 'vitest';
import { renderPortfolio } from './prerender.jsx';

test('the portfolio server render includes the site layout and complete pstack card without JavaScript', () => {
  const dom = new JSDOM(renderPortfolio());
  const { document } = dom.window;

  expect(document.querySelector('nav').getAttribute('aria-label')).toBe('Main navigation');
  expect(document.querySelector('main h1').textContent).toBe('A Collection of My Projects');
  const card = [...document.querySelectorAll('article')].find(
    article => article.querySelector('h2').textContent === 'pstack for GitHub Copilot'
  );
  expect([...card.querySelectorAll('p')].map(paragraph => paragraph.textContent)).toEqual([
    'Coordinate multiple agents in GitHub Copilot with engineering skills, playbooks, and Azure DevOps integration. Investigate bugs, review changes, and build features with explicit verification.',
    "An independent Copilot port of poteto's pstack for Cursor. Not an official GitHub product.",
    'Browse the source on GitHub.',
  ]);
  expect([...card.querySelectorAll('a')].map(link => ({
    label: link.textContent.trim(),
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
    rel: link.getAttribute('rel'),
  }))).toEqual([
    {
      label: 'source on GitHub',
      href: 'https://github.com/doublexmax/pstack-copilot',
      target: '_blank',
      rel: 'noreferrer',
    },
    {
      label: 'Explore pstack',
      href: 'https://doublexmax.github.io/pstack-copilot/',
      target: '_blank',
      rel: 'noreferrer',
    },
  ]);
  expect(card.querySelectorAll('.btn')).toHaveLength(1);
  expect(card.querySelector('.card-body > .btn').getAttribute('href')).toBe(
    'https://doublexmax.github.io/pstack-copilot/'
  );
  expect(card.querySelector('.card-body > .btn i').getAttribute('aria-hidden')).toBe('true');
  expect(card.querySelector('.card-text p:last-child a').getAttribute('href')).toBe(
    'https://github.com/doublexmax/pstack-copilot'
  );
  expect(card.querySelector('img').getAttribute('src')).toBe('/images/pstack-copilot-banner.svg');
  dom.window.close();
});
