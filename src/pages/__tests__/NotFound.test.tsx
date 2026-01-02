import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from '../NotFound';

function renderNotFound() {
  return render(
    <BrowserRouter>
      <NotFound />
    </BrowserRouter>
  );
}

describe('NotFound', () => {
  it('should render 404 heading', () => {
    renderNotFound();

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should render page not found message in Hebrew', () => {
    renderNotFound();

    expect(screen.getByText('הדף לא נמצא')).toBeInTheDocument();
    expect(screen.getByText('הדף שחיפשת אינו קיים')).toBeInTheDocument();
  });

  it('should have a link back to home', () => {
    renderNotFound();

    const homeLink = screen.getByRole('link', { name: /חזרה לדף הבית/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should render with RTL direction', () => {
    renderNotFound();

    const container = screen.getByText('404').closest('div[dir="rtl"]');
    expect(container).toBeInTheDocument();
  });
});
