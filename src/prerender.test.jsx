// @vitest-environment node
import { within } from '@testing-library/react';
import { JSDOM } from 'jsdom';
import { expect, test } from 'vitest';
import { renderPortfolio } from './prerender.jsx';

test('the portfolio server render includes the site layout and pstack card without JavaScript', () => {
  const dom = new JSDOM(renderPortfolio());
  const { document } = dom.window;

  expect(document.querySelector('nav').getAttribute('aria-label')).toBe('Main navigation');
  expect(document.querySelector('main h1').textContent).toMatch(/\S/);
  const card = [...document.querySelectorAll('article')].find(
    article => article.querySelector('h2').textContent === 'pstack for GitHub Copilot'
  );
  const source = card.querySelector('.card-text p:last-child a');
  expect(source.getAttribute('href')).toBe('https://github.com/doublexmax/pstack-copilot');
  expect([...card.querySelectorAll('.card-text p')].some(paragraph =>
    !paragraph.contains(source) && paragraph.textContent.trim().length > 0
  )).toBe(true);
  expect(within(card).getAllByRole('link', { name: /\S/ })).toHaveLength(2);
  expect([...card.querySelectorAll('a')].map(link => ({
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
    rel: link.getAttribute('rel'),
  }))).toEqual([
    {
      href: 'https://github.com/doublexmax/pstack-copilot',
      target: '_blank',
      rel: 'noreferrer',
    },
    {
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
  expect(card.querySelector('img').getAttribute('src')).toBe('/images/pstack-copilot-banner.svg');
  dom.window.close();
});
