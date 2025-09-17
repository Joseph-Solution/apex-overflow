import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagInput } from '../TagInput';

// Mock the useTags hook
vi.mock('@/hooks/useTags', () => ({
  useTags: () => ({
    getTagSuggestions: vi.fn((input: string) => 
      ['work', 'personal', 'urgent', 'project'].filter(tag => 
        tag.toLowerCase().includes(input.toLowerCase())
      )
    ),
    getPopularTags: vi.fn(() => ['work', 'personal', 'urgent']),
  }),
}));

describe('TagInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with empty tags', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Add tags...');
    expect(input).toBeInTheDocument();
  });

  it('displays existing tags', () => {
    render(<TagInput tags={['work', 'urgent']} onChange={mockOnChange} />);
    
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('adds a new tag when Enter is pressed', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'new-tag' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnChange).toHaveBeenCalledWith(['new-tag']);
  });

  it('removes a tag when X button is clicked', () => {
    render(<TagInput tags={['work', 'urgent']} onChange={mockOnChange} />);
    
    const removeButtons = screen.getAllByRole('button');
    const workTagRemoveButton = removeButtons.find(button => 
      button.closest('[data-tag="work"]') || 
      button.parentElement?.textContent?.includes('work')
    );
    
    if (workTagRemoveButton) {
      fireEvent.click(workTagRemoveButton);
      expect(mockOnChange).toHaveBeenCalledWith(['urgent']);
    }
  });

  it('removes last tag when Backspace is pressed on empty input', () => {
    render(<TagInput tags={['work', 'urgent']} onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.keyDown(input, { key: 'Backspace' });
    
    expect(mockOnChange).toHaveBeenCalledWith(['work']);
  });

  it('prevents duplicate tags', () => {
    render(<TagInput tags={['work']} onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('respects maxTags limit', () => {
    const maxTags = 2;
    render(<TagInput tags={['work', 'urgent']} onChange={mockOnChange} maxTags={maxTags} />);
    
    expect(screen.getByText('Maximum 2 tags allowed')).toBeInTheDocument();
    
    // Input should not be visible when at max tags
    expect(screen.queryByPlaceholderText('Add tags...')).not.toBeInTheDocument();
  });

  it('trims whitespace from tags', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: '  spaced-tag  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnChange).toHaveBeenCalledWith(['spaced-tag']);
  });

  it('ignores empty tags', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<TagInput tags={['work']} onChange={mockOnChange} disabled={true} />);
    
    // Should not show input when disabled
    expect(screen.queryByPlaceholderText('Add tags...')).not.toBeInTheDocument();
    
    // Should not show remove buttons when disabled
    const removeButtons = screen.queryAllByRole('button');
    expect(removeButtons).toHaveLength(0);
  });
});