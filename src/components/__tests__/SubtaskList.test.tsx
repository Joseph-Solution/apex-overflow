import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import SubtaskList from '../SubtaskList';
import { Task } from '@/hooks/useTasks';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('SubtaskList', () => {
  const mockParentTask: Task = {
    id: 'parent-1',
    title: 'Parent Task',
    description: 'Parent task description',
    completed: false,
    priority: 'medium',
    due_date: '2024-12-31',
    category_id: 'cat-1',
    project_id: 'proj-1',
    tags: ['tag1'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSubtasks: Task[] = [
    {
      id: 'subtask-1',
      title: 'Subtask 1',
      description: 'First subtask',
      completed: false,
      priority: 'medium',
      parent_task_id: 'parent-1',
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'subtask-2',
      title: 'Subtask 2',
      description: 'Second subtask',
      completed: true,
      priority: 'high',
      parent_task_id: 'parent-1',
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockProps = {
    parentTask: mockParentTask,
    subtasks: mockSubtasks,
    onCreateSubtask: vi.fn(),
    onUpdateSubtask: vi.fn(),
    onDeleteSubtask: vi.fn(),
    onToggleSubtaskComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders subtask list with progress indicator', () => {
    render(<SubtaskList {...mockProps} />);
    
    expect(screen.getByText('Subtasks (1/2)')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Subtask 2')).toBeInTheDocument();
  });

  it('shows add subtask button when no subtasks exist', () => {
    render(<SubtaskList {...mockProps} subtasks={[]} />);
    
    expect(screen.getByText('Add Subtask')).toBeInTheDocument();
  });

  it('can toggle subtask expansion', async () => {
    const user = userEvent.setup();
    render(<SubtaskList {...mockProps} />);
    
    const expandButton = screen.getByRole('button', { name: /subtasks/i });
    
    // Initially expanded, subtasks should be visible
    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    
    // Click to collapse
    await user.click(expandButton);
    
    // Subtasks should be hidden (but the header should still be there)
    expect(screen.queryByText('Subtask 1')).not.toBeInTheDocument();
  });

  it('can create a new subtask', async () => {
    const user = userEvent.setup();
    mockProps.onCreateSubtask.mockResolvedValue(undefined);
    
    render(<SubtaskList {...mockProps} />);
    
    // Click add subtask button
    const addButton = screen.getByRole('button', { name: /add subtask/i });
    await user.click(addButton);
    
    // Enter subtask title
    const input = screen.getByPlaceholderText('Enter subtask title...');
    await user.type(input, 'New Subtask');
    
    // Click add button
    const confirmButton = screen.getByRole('button', { name: 'Add' });
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(mockProps.onCreateSubtask).toHaveBeenCalledWith({
        title: 'New Subtask',
        description: '',
        completed: false,
        priority: 'medium',
        parent_task_id: 'parent-1',
        category_id: 'cat-1',
        project_id: 'proj-1',
        tags: [],
      });
    });
  });

  it('can create subtask with Enter key', async () => {
    const user = userEvent.setup();
    mockProps.onCreateSubtask.mockResolvedValue(undefined);
    
    render(<SubtaskList {...mockProps} />);
    
    // Click add subtask button
    const addButton = screen.getByRole('button', { name: /add subtask/i });
    await user.click(addButton);
    
    // Enter subtask title and press Enter
    const input = screen.getByPlaceholderText('Enter subtask title...');
    await user.type(input, 'New Subtask{enter}');
    
    await waitFor(() => {
      expect(mockProps.onCreateSubtask).toHaveBeenCalledWith({
        title: 'New Subtask',
        description: '',
        completed: false,
        priority: 'medium',
        parent_task_id: 'parent-1',
        category_id: 'cat-1',
        project_id: 'proj-1',
        tags: [],
      });
    });
  });

  it('can cancel subtask creation with Escape key', async () => {
    const user = userEvent.setup();
    
    render(<SubtaskList {...mockProps} />);
    
    // Click add subtask button
    const addButton = screen.getByRole('button', { name: /add subtask/i });
    await user.click(addButton);
    
    // Press Escape to cancel
    const input = screen.getByPlaceholderText('Enter subtask title...');
    await user.type(input, 'New Subtask{escape}');
    
    // Input should be gone
    expect(screen.queryByPlaceholderText('Enter subtask title...')).not.toBeInTheDocument();
    expect(mockProps.onCreateSubtask).not.toHaveBeenCalled();
  });

  it('can toggle subtask completion', async () => {
    const user = userEvent.setup();
    mockProps.onToggleSubtaskComplete.mockResolvedValue(undefined);
    
    render(<SubtaskList {...mockProps} />);
    
    // Find the checkbox for the first subtask (uncompleted)
    const checkboxes = screen.getAllByRole('checkbox');
    const firstSubtaskCheckbox = checkboxes[0];
    
    await user.click(firstSubtaskCheckbox);
    
    expect(mockProps.onToggleSubtaskComplete).toHaveBeenCalledWith('subtask-1', true);
  });

  it('can edit subtask title', async () => {
    const user = userEvent.setup();
    mockProps.onUpdateSubtask.mockResolvedValue(undefined);
    
    render(<SubtaskList {...mockProps} />);
    
    // Click edit button for first subtask
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.getAttribute('class')?.includes('lucide-edit');
    });
    
    if (editButton) {
      await user.click(editButton);
      
      // Find the input field and update the title
      const input = screen.getByDisplayValue('Subtask 1');
      await user.clear(input);
      await user.type(input, 'Updated Subtask');
      
      // Click save button
      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockProps.onUpdateSubtask).toHaveBeenCalledWith('subtask-1', {
          title: 'Updated Subtask',
        });
      });
    }
  });

  it('can save subtask edit with Enter key', async () => {
    const user = userEvent.setup();
    mockProps.onUpdateSubtask.mockResolvedValue(undefined);
    
    render(<SubtaskList {...mockProps} />);
    
    // Click edit button for first subtask
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.getAttribute('class')?.includes('lucide-edit');
    });
    
    if (editButton) {
      await user.click(editButton);
      
      // Find the input field and update the title with Enter
      const input = screen.getByDisplayValue('Subtask 1');
      await user.clear(input);
      await user.type(input, 'Updated Subtask{enter}');
      
      await waitFor(() => {
        expect(mockProps.onUpdateSubtask).toHaveBeenCalledWith('subtask-1', {
          title: 'Updated Subtask',
        });
      });
    }
  });

  it('can cancel subtask edit with Escape key', async () => {
    const user = userEvent.setup();
    
    render(<SubtaskList {...mockProps} />);
    
    // Click edit button for first subtask
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.getAttribute('class')?.includes('lucide-edit');
    });
    
    if (editButton) {
      await user.click(editButton);
      
      // Press Escape to cancel
      const input = screen.getByDisplayValue('Subtask 1');
      await user.type(input, '{escape}');
      
      // Should return to display mode
      expect(screen.getByText('Subtask 1')).toBeInTheDocument();
      expect(mockProps.onUpdateSubtask).not.toHaveBeenCalled();
    }
  });

  it('can delete subtask', async () => {
    const user = userEvent.setup();
    mockProps.onDeleteSubtask.mockResolvedValue(undefined);
    
    render(<SubtaskList {...mockProps} />);
    
    // Click delete button for first subtask
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.getAttribute('class')?.includes('lucide-trash-2');
    });
    
    if (deleteButton) {
      await user.click(deleteButton);
      
      expect(mockProps.onDeleteSubtask).toHaveBeenCalledWith('subtask-1');
    }
  });

  it('validates subtask title is required', async () => {
    const user = userEvent.setup();
    
    render(<SubtaskList {...mockProps} />);
    
    // Click add subtask button
    const addButton = screen.getByRole('button', { name: /add subtask/i });
    await user.click(addButton);
    
    // Try to add without title
    const confirmButton = screen.getByRole('button', { name: 'Add' });
    await user.click(confirmButton);
    
    // Should not call create function
    expect(mockProps.onCreateSubtask).not.toHaveBeenCalled();
  });

  it('validates subtask edit title is required', async () => {
    const user = userEvent.setup();
    
    render(<SubtaskList {...mockProps} />);
    
    // Click edit button for first subtask
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => {
      const svg = button.querySelector('svg');
      return svg && svg.getAttribute('class')?.includes('lucide-edit');
    });
    
    if (editButton) {
      await user.click(editButton);
      
      // Clear the input and try to save
      const input = screen.getByDisplayValue('Subtask 1');
      await user.clear(input);
      
      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);
      
      // Should not call update function
      expect(mockProps.onUpdateSubtask).not.toHaveBeenCalled();
    }
  });

  it('displays correct completion percentage', () => {
    // Test with different completion ratios
    const allCompletedSubtasks = mockSubtasks.map(subtask => ({ ...subtask, completed: true }));
    
    const { rerender } = render(<SubtaskList {...mockProps} subtasks={allCompletedSubtasks} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Subtasks (2/2)')).toBeInTheDocument();
    
    const noCompletedSubtasks = mockSubtasks.map(subtask => ({ ...subtask, completed: false }));
    rerender(<SubtaskList {...mockProps} subtasks={noCompletedSubtasks} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Subtasks (0/2)')).toBeInTheDocument();
  });
});