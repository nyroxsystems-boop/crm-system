export interface User {
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

export interface Lead {
  id: string;
  company: string;
  contactPerson: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  city?: string;
  country?: string;
  address?: string;
  status: string;
  source: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  leadScore?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'task';
  title: string;
  description: string;
  date: string;
  completed: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Settings {
  pipelineStages: PipelineStage[];
  sources: string[];
  industries: string[];
  tags: string[];
  companyName: string;
  currency: string;
  statuses: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  isActive: boolean;
}

const LEADS_KEY = 'haendler_crm_leads';
const ACTIVITIES_KEY = 'haendler_crm_activities';
const SETTINGS_KEY = 'haendler_crm_settings';
const USERS_KEY = 'haendler_crm_users';
const PASSWORDS_KEY = 'haendler_crm_passwords';
const CURRENT_USER_KEY = 'haendler_crm_current_user';

const defaultSettings: Settings = {
  pipelineStages: [
    { id: '1', name: 'Neu', color: 'blue', order: 1, probability: 10, isActive: true },
    { id: '2', name: 'Kontaktiert', color: 'cyan', order: 2, probability: 20, isActive: true },
    { id: '3', name: 'Qualifiziert', color: 'green', order: 3, probability: 40, isActive: true },
    { id: '4', name: 'Angebot', color: 'yellow', order: 4, probability: 60, isActive: true },
    { id: '5', name: 'Verhandlung', color: 'orange', order: 5, probability: 80, isActive: true },
    { id: '6', name: 'Gewonnen', color: 'emerald', order: 6, probability: 100, isActive: true },
    { id: '7', name: 'Verloren', color: 'red', order: 7, probability: 0, isActive: true },
  ],
  sources: ['Website', 'Telefon', 'E-Mail', 'Empfehlung', 'Messe', 'LinkedIn', 'Kaltakquise', 'Partner'],
  industries: ['Automotive', 'Maschinenbau', 'IT & Software', 'Handel', 'Dienstleistung', 'Logistik', 'Produktion', 'Sonstiges'],
  tags: ['VIP', 'Großkunde', 'Neukunde', 'Stammkunde', 'Potenziell', 'Kritisch'],
  companyName: 'Händler CRM',
  currency: 'EUR',
  statuses: ['Neu', 'Kontaktiert', 'Qualifiziert', 'Angebot', 'Verhandlung', 'Gewonnen', 'Verloren'],
};

const defaultUsers: User[] = [
  { username: 'admin', name: 'Administrator', role: 'Admin', active: true, createdAt: new Date().toISOString() },
];

const defaultPasswords: Record<string, string> = {
  admin: 'admin123',
};

// Initialize users and passwords
export function initializeUsers() {
  const users = localStorage.getItem(USERS_KEY);
  const passwords = localStorage.getItem(PASSWORDS_KEY);
  
  if (!users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
  if (!passwords) {
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(defaultPasswords));
  }
}

// User Management
export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : defaultUsers;
  } catch (error) {
    console.error('Error loading users:', error);
    return defaultUsers;
  }
}

export function saveUser(user: Partial<User>, password?: string): void {
  const users = getUsers();
  const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
  const now = new Date().toISOString();
  
  const existingIndex = users.findIndex(u => u.username === user.username);
  
  if (existingIndex !== -1) {
    // Update existing user
    users[existingIndex] = { ...users[existingIndex], ...user };
    if (password) {
      passwords[user.username!] = password;
    }
  } else {
    // Create new user
    const newUser: User = {
      username: user.username || '',
      name: user.name || '',
      email: user.email,
      phone: user.phone,
      role: user.role || 'Vertrieb',
      active: user.active !== undefined ? user.active : true,
      createdAt: now,
    };
    users.push(newUser);
    if (password) {
      passwords[user.username!] = password;
    }
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

export function deleteUser(username: string): void {
  const users = getUsers();
  const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
  
  const filtered = users.filter(u => u.username !== username);
  delete passwords[username];
  
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

export function getUserPassword(username: string): string | null {
  const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
  return passwords[username] || null;
}

// Login
export function login(username: string, password: string): User | null {
  initializeUsers();
  const users = getUsers();
  const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
  
  const user = users.find(u => u.username === username && u.active);
  if (user && passwords[username] === password) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  
  return null;
}

// Logout
export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Get current user
export function getCurrentUser(): User | null {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

// Leads
export function getLeads(): Lead[] {
  try {
    const data = localStorage.getItem(LEADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading leads:', error);
    return [];
  }
}

export function saveLead(lead: Partial<Lead>): void {
  const leads = getLeads();
  const now = new Date().toISOString();
  const currentUser = getCurrentUser();
  
  if (lead.id) {
    const index = leads.findIndex(l => l.id === lead.id);
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        ...lead,
        updatedAt: now,
        lastModifiedBy: currentUser?.name,
      };
    }
  } else {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      company: lead.company || '',
      contactPerson: lead.contactPerson || '',
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website,
      industry: lead.industry,
      city: lead.city,
      country: lead.country,
      address: lead.address,
      status: lead.status || 'Neu',
      source: lead.source || 'Website',
      value: lead.value,
      priority: lead.priority,
      assignedTo: lead.assignedTo || currentUser?.name,
      notes: lead.notes,
      tags: lead.tags || [],
      leadScore: lead.leadScore || 0,
      lastContactDate: lead.lastContactDate,
      nextFollowUpDate: lead.nextFollowUpDate,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser?.name,
    };
    leads.unshift(newLead);
  }
  
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function deleteLead(id: string): void {
  const leads = getLeads();
  const filtered = leads.filter(l => l.id !== id);
  localStorage.setItem(LEADS_KEY, JSON.stringify(filtered));
  
  // Also delete associated activities
  const activities = getActivities();
  const filteredActivities = activities.filter(a => a.leadId !== id);
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(filteredActivities));
}

// Import leads
export function importLeads(leadsData: Partial<Lead>[]): void {
  const currentUser = getCurrentUser();
  const now = new Date().toISOString();
  
  const leads = getLeads();
  const newLeads: Lead[] = leadsData.map(lead => ({
    id: crypto.randomUUID(),
    company: lead.company || '',
    contactPerson: lead.contactPerson || '',
    email: lead.email || '',
    phone: lead.phone || '',
    website: lead.website,
    industry: lead.industry,
    city: lead.city,
    country: lead.country,
    address: lead.address,
    status: lead.status || 'Neu',
    source: lead.source || 'Import',
    value: lead.value || 0,
    priority: lead.priority || 'Mittel',
    assignedTo: lead.assignedTo || currentUser?.name,
    notes: lead.notes,
    tags: lead.tags || [],
    leadScore: lead.leadScore || 0,
    lastContactDate: lead.lastContactDate,
    nextFollowUpDate: lead.nextFollowUpDate,
    createdAt: now,
    updatedAt: now,
    createdBy: currentUser?.name,
  }));
  
  localStorage.setItem(LEADS_KEY, JSON.stringify([...newLeads, ...leads]));
}

// Activities
export function getActivities(leadId?: string): Activity[] {
  try {
    const data = localStorage.getItem(ACTIVITIES_KEY);
    const activities = data ? JSON.parse(data) : [];
    return leadId ? activities.filter((a: Activity) => a.leadId === leadId) : activities;
  } catch (error) {
    console.error('Error loading activities:', error);
    return [];
  }
}

export function saveActivity(activity: Partial<Activity>): void {
  const activities = getActivities();
  const now = new Date().toISOString();
  const currentUser = getCurrentUser();
  
  if (activity.id) {
    const index = activities.findIndex(a => a.id === activity.id);
    if (index !== -1) {
      activities[index] = {
        ...activities[index],
        ...activity,
      };
    }
  } else {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      leadId: activity.leadId || '',
      type: activity.type || 'note',
      title: activity.title || '',
      description: activity.description || '',
      date: activity.date || now,
      completed: activity.completed || false,
      createdBy: activity.createdBy || currentUser?.name || 'System',
      createdAt: now,
    };
    activities.unshift(newActivity);
  }
  
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

export function deleteActivity(id: string): void {
  const activities = getActivities();
  const filtered = activities.filter(a => a.id !== id);
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(filtered));
}

// Settings
export function getSettings(): Settings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}