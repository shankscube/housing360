import { useEffect, useState } from 'react';
import type { TaskFilter, TaskListItem } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { DataTable, FilterChipRow, Icon, StatusBadge, type DataTableColumn } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTaskDetail, fetchTasks, setListFilter, setListPage, setSearchTerm } from '../../store/slices/tasksSlice';
import { TaskDetailModal } from './TaskDetailModal';

const FILTER_OPTIONS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  { value: 'due_today', label: 'Due Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
];

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

interface TaskTableRow extends TaskListItem, Record<string, unknown> {}

export function TasksPage() {
  const dispatch = useAppDispatch();
  const { items, status, filter, search, page, pageSize, total } = useAppSelector((state) => state.tasks.list);

  const [searchInput, setSearchInput] = useState(search);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(setSearchTerm(searchInput));
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, dispatch]);

  useEffect(() => {
    dispatch(fetchTasks({ page, pageSize, filter, search }));
  }, [dispatch, page, pageSize, filter, search]);

  function handleFilterChange(value: string) {
    dispatch(setListFilter(value as TaskFilter));
  }

  function handleOpenTask(row: TaskTableRow) {
    setSelectedTaskId(row.id);
    dispatch(fetchTaskDetail(row.id));
  }

  function handleCloseModal() {
    setSelectedTaskId(null);
  }

  function handleSaved() {
    dispatch(fetchTasks({ page, pageSize, filter, search }));
  }

  const columns: DataTableColumn<TaskTableRow>[] = [
    {
      key: 'priority',
      header: 'Priority',
      cell: (row) => (row.priority ? <StatusBadge label={row.priority} /> : '—'),
    },
    { key: 'subject', header: 'Subject', cell: (row) => row.subject },
    { key: 'owner', header: 'Owner', cell: (row) => row.ownerName ?? '—' },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      numeric: true,
      cell: (row) => formatDate(row.dueDate),
    },
  ];

  return (
    <ContentAreaTemplate title="Tasks" subtitle="Click a task to open the activity.">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="flex flex-col gap-5 px-9 py-7">
          <FilterChipRow options={FILTER_OPTIONS} activeValue={filter} onChange={handleFilterChange} />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search tasks by subject or owner"
            aria-label="Search tasks"
            className="w-full rounded-md border border-borderStrong bg-surface px-7 py-4 text-base text-ink outline-none transition-colors focus:border-ink"
          />
        </div>

        <DataTable<TaskTableRow>
          columns={columns}
          rows={items as TaskTableRow[]}
          rowKey={(row) => row.id}
          isLoading={status === 'loading'}
          emptyMessage="No tasks found."
          rowActions={[
            {
              key: 'view',
              label: 'Open task',
              icon: <Icon name="chevronRight" size={14} />,
              onClick: handleOpenTask,
            },
          ]}
          pagination={{ page, pageSize, total, onPageChange: (nextPage) => dispatch(setListPage(nextPage)) }}
        />
      </div>

      <TaskDetailModal taskId={selectedTaskId} onClose={handleCloseModal} onSaved={handleSaved} />
    </ContentAreaTemplate>
  );
}
