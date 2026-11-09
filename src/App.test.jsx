import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import App from './App.jsx';
import charts from './features/poker/default-ranges.json';

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}));

vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}));

afterEach(() => {
  cleanup();
  Object.keys(charts).forEach((key) => localStorage.removeItem(key));
});

test('the homepage retains its introduction, portfolio destination, and resume link', () => {
  window.history.replaceState({}, '', '/');
  render(<App />, { wrapper: BrowserRouter });

  expect(screen.getByRole('heading', { name: "I'm Maxx." })).toBeInTheDocument();
  expect(screen.getByText(/Software Engineer @ Microsoft/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/portfolio');
  expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/Maxx_Tandon_Resume.pdf');
  expect(document.querySelector('.me-image')).toHaveAttribute('src', '/images/portrait-maxx.jpg');
});

test('the portfolio omits dealers.school and retains its other project destinations', () => {
  window.history.replaceState({}, '', '/portfolio');
  render(<App />, { wrapper: BrowserRouter });

  expect(screen.getByRole('heading', { name: 'A Collection of My Projects' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'dealers.school' })).not.toBeInTheDocument();
  expect(document.querySelector('a[href="https://dealers.school/"]')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Check out the repository' })).toHaveAttribute(
    'href',
    'https://github.com/willredding314/FischerRandom'
  );
  expect(screen.getByRole('link', { name: 'Try it yourself' })).toHaveAttribute('href', '/gto-trainer');
  expect(screen.getByRole('link', { name: 'Play Papplu' })).toHaveAttribute('href', '/papplu');
  expect(screen.getAllByRole('img').map((image) => image.getAttribute('src'))).toEqual([
    '/images/logo.png',
    '/images/fischer-random-banner.png',
    '/images/gto-trainer-banner.png',
    '/images/papplu-banner.svg',
    '/images/pstack-copilot-banner.svg',
  ]);
});

test('the portfolio presents pstack with its purpose, attribution, overview, and source', () => {
  window.history.replaceState({}, '', '/portfolio');
  render(<App />, { wrapper: BrowserRouter });

  const article = screen.getByRole('heading', { name: 'pstack for GitHub Copilot' }).closest('article');
  const card = within(article);
  expect(card.getByText(
    'Coordinate multiple agents in GitHub Copilot with engineering skills, playbooks, and Azure DevOps integration. Investigate bugs, review changes, and build features with explicit verification.'
  )).toBeInTheDocument();
  expect(card.getByText(
    "An independent Copilot port of poteto's pstack for Cursor. Not an official GitHub product."
  )).toBeInTheDocument();
  expect(card.getByRole('img', { name: 'pstack workflow diagram for GitHub Copilot' })).toHaveAttribute(
    'src',
    '/images/pstack-copilot-banner.svg'
  );

  const overview = card.getByRole('link', { name: 'Explore pstack' });
  expect(overview).toHaveAttribute('href', 'https://doublexmax.github.io/pstack-copilot/');
  expect(overview).toHaveAttribute('target', '_blank');
  expect(overview).toHaveAttribute('rel', 'noreferrer');
  expect([...article.querySelectorAll('.btn')]).toEqual([overview]);
  expect(overview.parentElement).toBe(article.querySelector('.card-body'));
  expect(overview.querySelector('i')).toHaveAttribute('aria-hidden', 'true');

  const source = card.getByRole('link', { name: 'source on GitHub' });
  expect(source).toHaveAttribute('href', 'https://github.com/doublexmax/pstack-copilot');
  expect(source).toHaveAttribute('target', '_blank');
  expect(source).toHaveAttribute('rel', 'noreferrer');
  expect(source.closest('p').textContent).toBe('Browse the source on GitHub.');
  expect(article.querySelector('.card-text')).toContainElement(source);
  expect(card.getAllByRole('link')).toEqual([source, overview]);
});

test('the trainer retains its controls, initial counters, and selected chart', async () => {
  window.history.replaceState({}, '', '/gto-trainer');
  render(<App />, { wrapper: BrowserRouter });

  expect(await screen.findByRole('button', { name: 'Simulate' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Manage Charts/ })).toBeInTheDocument();
  expect(screen.getByLabelText('Slow Mode')).toBeChecked();
  expect(screen.getByLabelText('RFI Only')).not.toBeChecked();
  expect(screen.getByLabelText('3B Only')).not.toBeChecked();
  expect(screen.getByLabelText('Invert RNG')).not.toBeChecked();
  expect(screen.getByText('Num Correct: 0')).toBeInTheDocument();
  expect(screen.getByText('Total Sims: 0')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Manage Charts/ }));
  await waitFor(() => {
    expect(document.getElementById('utg').querySelectorAll('td')).toHaveLength(169);
  });

  const cells = within(document.getElementById('utg')).getAllByRole('cell');
  expect(cells[0]).toHaveTextContent('AA');
  expect(cells[1]).toHaveTextContent('AKs');
  expect(cells[13]).toHaveTextContent('AKo');
  expect(cells[168]).toHaveTextContent('22');
});

test('internal navigation renders the portfolio through the existing router', () => {
  window.history.replaceState({}, '', '/');
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(<App />, { wrapper: BrowserRouter });

  fireEvent.click(screen.getByRole('link', { name: 'Portfolio' }));

  expect(screen.getByRole('heading', { name: 'A Collection of My Projects' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/portfolio');
  expect(scroll).toHaveBeenCalledWith(0, 0);
  scroll.mockRestore();
});

test('the Papplu route is isolated from site chrome and navigates back to the portfolio', async () => {
  window.history.replaceState({}, '', '/papplu');
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(<App />, { wrapper: BrowserRouter });

  expect(await screen.findByRole('heading', { name: 'A seat at your own table.' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Play table' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Hand Builder' })).toBeInTheDocument();
  expect(document.querySelector('.site-header')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');

  fireEvent.click(screen.getByRole('link', { name: 'Back to portfolio' }));

  expect(screen.getByRole('heading', { name: 'A Collection of My Projects' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Play Papplu' })).toHaveAttribute('href', '/papplu');
  expect(document.querySelector('.papplu-page')).not.toBeInTheDocument();
  expect(window.location.pathname).toBe('/portfolio');
  scroll.mockRestore();
});
