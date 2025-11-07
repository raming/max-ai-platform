import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataTable, DataTableColumn } from '@/components/data-display/data-table';

interface TestData extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

describe('DataTable', () => {
  const columns: DataTableColumn<TestData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Status',
      render: (value: unknown) => <span className={`status-${value}`}>{String(value)}</span>,
    },
  ];

  const sampleData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  ];

  it('renders table with headers', () => {
    render(<DataTable columns={columns} data={sampleData} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders table rows with data', () => {
    render(<DataTable columns={columns} data={sampleData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('displays empty message when no data', () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="No records found" />
    );
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders custom content using render function', () => {
    render(<DataTable columns={columns} data={sampleData} />);
    const statusElement = screen.getByText('active');
    expect(statusElement).toHaveClass('status-active');
  });

  it('displays title and description when provided', () => {
    render(
      <DataTable
        title="Users"
        description="List of all users"
        columns={columns}
        data={sampleData}
      />
    );
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('List of all users')).toBeInTheDocument();
  });

  it('uses default empty message', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders all columns correctly', () => {
    const { container } = render(
      <DataTable columns={columns} data={sampleData} />
    );
    const headerCells = container.querySelectorAll('thead th');
    expect(headerCells.length).toBe(4);
  });
});
