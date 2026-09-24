import { ListCard, StatusBadge } from '../../src/components/ui';
import type { ComponentPreview } from './types';

interface DemoTask {
  id: string;
  title: string;
  contextLine: string;
  overdue: boolean;
}

const DEMO_TASKS: DemoTask[] = [
  { id: '1', title: 'Follow up on housing application', contextLine: 'Jane Doe', overdue: false },
  { id: '2', title: 'Submit disability verification', contextLine: 'Marcus Lee', overdue: true },
];

export const listCardPreview: ComponentPreview = {
  name: 'ListCard',
  reference: 'Home screen → Today\'s Tasks / Data Quality Alerts / Today\'s Appointments / Recently Assessed',
  variants: [
    {
      name: 'With rows',
      element: (
        <div className="max-w-md">
          <ListCard
            title="Today's Tasks"
            headerAction={{ label: 'New Task', onClick: () => {} }}
            items={DEMO_TASKS}
            emptyMessage="No tasks due today."
            renderItem={(task) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
                  <p className="text-xs text-textMuted">{task.contextLine}</p>
                </div>
                {task.overdue ? <StatusBadge label="Overdue" /> : null}
              </div>
            )}
          />
        </div>
      ),
    },
    {
      name: 'Empty (not-yet-specified panel)',
      element: (
        <div className="max-w-md">
          <ListCard
            title="Today's Appointments"
            items={[]}
            emptyMessage="Appointments aren't tracked yet — this panel is reserved for a future change."
            renderItem={() => null}
          />
        </div>
      ),
    },
    {
      name: 'Loading',
      element: (
        <div className="max-w-md">
          <ListCard
            title="Today's Tasks"
            items={[]}
            isLoading
            emptyMessage="No tasks due today."
            renderItem={() => null}
          />
        </div>
      ),
    },
  ],
};
