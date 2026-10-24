import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the home page with the main call to action', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { level: 1, name: /connecting surplus food/i })
  ).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /donate food/i }).length).toBeGreaterThan(0);
});
