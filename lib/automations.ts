// Central registry of tools shown on the dashboard. This file is the only
// place the dashboard reads from, so the UI updates automatically.

export type Automation = {
  id: string;
  name: string;
  description: string;
  status: 'live' | 'coming-soon';
  href: string;
};

export const automations: Automation[] = [
  {
    id: 'status-tracker',
    name: 'Status Tracker',
    description: 'Track internal tasks by status -- pending, in progress, or completed.',
    status: 'live',
    href: '/status-tracker'
  },
  {
    id: 'el-tracker',
    name: 'EL Tracker',
    description: 'Track client engagement/agreement dates and see what is expiring soon.',
    status: 'live',
    href: '/el-tracker'
  },
  {
    id: 'gst-reconciliation',
    name: 'GST Reconciliation',
    description: 'Track GST filing periods and reconcile books figures against the GST portal.',
    status: 'live',
    href: '/gst-reconciliation'
  },
  {
    id: 'lease-agreement',
    name: 'Lease Agreement',
    description: 'Track property/asset leases -- lessor, rent, and expiry.',
    status: 'live',
    href: '/lease-agreement'
  },
  {
    id: 'todo-list',
    name: 'To-Do List',
    description: 'Assign tasks to one or more people, track priority/due dates, and log work.',
    status: 'live',
    href: '/todo-list'
  },
  {
    id: 'e-signature',
    name: 'e-Signature',
    description: 'Post company policies for staff to review and sign off on.',
    status: 'live',
    href: '/e-signature'
  }
];
