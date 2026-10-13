import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App.jsx';
import charts from './charts.json';

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}));

vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}));

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => charts,
  });
});

afterEach(() => {
  cleanup();
  global.fetch = originalFetch;
  Object.keys(charts).forEach((key) => localStorage.removeItem(key));
});

test('the homepage retains its introduction, portfolio destination, and resume link', () => {
  window.history.replaceState({}, '', '/');
  render(<App />);

  expect(screen.getByRole('heading', { name: "I'm Maxx." })).toBeInTheDocument();
  expect(screen.getByText(/Software Engineer @ Microsoft/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/portfolio');
  expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', 'Maxx_Tandon_Resume.pdf');
});

test('the portfolio retains its project destinations', () => {
  window.history.replaceState({}, '', '/portfolio');
  render(<App />);

  expect(screen.getByRole('heading', { name: 'A Collection of My Projects' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Check it out' })).toHaveAttribute('href', 'https://dealers.school/');
  expect(screen.getByRole('link', { name: 'Check out the repository' })).toHaveAttribute(
    'href',
    'https://github.com/willredding314/FischerRandom'
  );
  expect(screen.getByRole('link', { name: 'Try it yourself' })).toHaveAttribute('href', '/gto-trainer');
});

test('the trainer retains its controls, initial counters, and selected chart', async () => {
  window.history.replaceState({}, '', '/gto-trainer');
  render(<App />);

  expect(screen.getByRole('button', { name: 'Simulate' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Manage Charts/ })).toBeInTheDocument();
  expect(screen.getByLabelText('Slow Mode')).toBeChecked();
  expect(screen.getByLabelText('RFI Only')).not.toBeChecked();
  expect(screen.getByLabelText('3B Only')).not.toBeChecked();
  expect(screen.getByLabelText('Invert RNG')).not.toBeChecked();
  expect(screen.getByText('Num Correct: 0')).toBeInTheDocument();
  expect(screen.getByText('Total Sims: 0')).toBeInTheDocument();

  await waitFor(() => {
    expect(document.getElementById('utg').querySelectorAll('td')).toHaveLength(169);
  });

  const cells = within(document.getElementById('utg')).getAllByRole('cell');
  expect(cells[0]).toHaveTextContent('AA');
  expect(cells[1]).toHaveTextContent('AKs');
  expect(cells[13]).toHaveTextContent('AKo');
  expect(cells[168]).toHaveTextContent('22');
});
