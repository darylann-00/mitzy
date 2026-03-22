import { render, screen } from '@testing-library/react';
import App from './App';

test('renders mitzy header', () => {
  render(<App />);
  expect(screen.getAllByText(/mitzy/i)[0]).toBeInTheDocument();
});
