import { scheduleSyncToCloud } from './supabase.js';

const KEY = 'life_os';

const DEFAULT = {
  dashboard: {
    daily_tasks: [],
    main_goal: '',
    main_risk: ''
  },
  finance: {
    cards: [],
    debts: [],
    monthly_income: 0,
    monthly_expenses: [],
    assets: [],
    liabilities: []
  },
  inbox: [],
  goals: {
    main: { title: '', deadline: '', progress: 0, next_step: '', motivation: '' },
    subgoals: []
  },
  work: {
    sales_today: 0,
    profit: 0,
    avg_check: 0,
    conversion: 0,
    plan: 0,
    fact: 0,
    ideas: [],
    problems: [],
    blockers: [],
    tomorrow: ''
  },
  relations: {
    partner_name: '',
    last_date: '',
    next_date: '',
    next_date_desc: '',
    date_ideas: [],
    promises: [],
    gifts: [],
    important_dates: [],
    notes: ''
  },
  friends: [],
  health: { logs: [] },
  habits: [],
  weekly: []
};

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else if (!(key in target)) {
      out[key] = source[key];
    }
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return deepMerge(JSON.parse(raw), DEFAULT);
  } catch {
    return structuredClone(DEFAULT);
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  scheduleSyncToCloud(data);
}

export const store = {
  get(path) {
    const data = load();
    if (!path) return data;
    return path.split('.').reduce((obj, k) => obj?.[k], data);
  },
  set(path, value) {
    const data = load();
    const keys = path.split('.');
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj)) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    save(data);
  },
  update(path, fn) {
    const current = this.get(path);
    this.set(path, fn(current));
  },
  getAll() { return load(); },
  reset() { localStorage.removeItem(KEY); }
};
