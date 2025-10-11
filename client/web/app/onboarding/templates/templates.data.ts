export type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  category?: string;
};

export const TEMPLATES: TemplateInfo[] = [
  { id: 'welcome-bot', name: 'Welcome Bot', description: 'Greets new contacts and captures essentials', category: 'starter' },
  { id: 'support-intake', name: 'Support Intake', description: 'Collects support details and triages', category: 'support' },
  { id: 'appointment-scheduler', name: 'Appointment Scheduler', description: 'Schedules calls and sends reminders', category: 'scheduling' },
];