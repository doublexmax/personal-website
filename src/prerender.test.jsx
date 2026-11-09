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
  ]);
  expect([...card.querySelectorAll('a')].map(link => ({
    label: link.textContent.trim(),
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
    rel: link.getAttribute('rel'),
  }))).toEqual([
    {
      label: 'Read the overview',
      href: 'https://doublexmax.github.io/pstack-copilot/',
      target: '_blank',
      rel: 'noreferrer',
    },
    {
      label: 'View source on GitHub',
      href: 'https://github.com/doublexmax/pstack-copilot',
      target: '_blank',
      rel: 'noreferrer',
    },
  ]);
  expect(card.querySelector('img').getAttribute('src')).toBe('/images/pstack-copilot-banner.svg');
  dom.window.close();
});
