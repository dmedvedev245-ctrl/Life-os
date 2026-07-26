import { DashboardPage } from './pages/Dashboard.js';
import { FinancePage } from './pages/Finance.js';
import { InboxPage } from './pages/Inbox.js';
import { GoalsPage } from './pages/Goals.js';
import { MorePage } from './pages/More.js';
import { WorkPage } from './pages/Work.js';
import { HealthPage } from './pages/Health.js';
import { HabitsPage } from './pages/Habits.js';
import { RelationsPage } from './pages/Relations.js';
import { FriendsPage } from './pages/Friends.js';
import { WeeklyPage } from './pages/Weekly.js';
import { SearchPage } from './pages/Search.js';
import { StatsPage } from './pages/Stats.js';
import { AuthPage } from './pages/Auth.js';
import { DebtPlanPage } from './pages/DebtPlan.js';
import { PlannerPage } from './pages/Planner.js';

const ROUTES = {
  '#/auth': AuthPage,
  '#/dashboard': DashboardPage,
  '#/finance': FinancePage,
  '#/inbox': InboxPage,
  '#/goals': GoalsPage,
  '#/more': MorePage,
  '#/work': WorkPage,
  '#/health': HealthPage,
  '#/habits': HabitsPage,
  '#/relations': RelationsPage,
  '#/friends': FriendsPage,
  '#/weekly': WeeklyPage,
  '#/search': SearchPage,
  '#/stats': StatsPage,
  '#/debtplan': DebtPlanPage,
  '#/planner': PlannerPage
};

const NAV_ORDER = ['#/dashboard', '#/finance', '#/inbox', '#/habits', '#/more'];

let currentHash = '';
const container = document.getElementById('page-container');

function getIndex(hash) {
  return NAV_ORDER.indexOf(hash);
}

export function navigate(hash, opts = {}) {
  if (hash === currentHash && !opts.force) return;

  const prevHash = currentHash;
  currentHash = hash;

  const PageClass = ROUTES[hash];
  if (!PageClass) {
    navigate('#/dashboard');
    return;
  }

  const prevIndex = getIndex(prevHash);
  const nextIndex = getIndex(hash);
  let animClass = '';
  if (!opts.noAnim) {
    if (prevIndex === -1 || nextIndex === -1) animClass = 'slide-left';
    else if (nextIndex > prevIndex) animClass = 'slide-left';
    else if (nextIndex < prevIndex) animClass = 'slide-right';
  }

  const page = new PageClass();
  const el = page.render();
  el.classList.add('page');
  if (animClass) el.classList.add(animClass);

  document.getElementById('bottom-nav').style.display = hash === '#/auth' ? 'none' : '';

  container.innerHTML = '';
  container.appendChild(el);

  window.location.hash = hash;
  updateNav(hash);
}

export function getCurrentHash() { return currentHash; }

function updateNav(hash) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.hash === hash);
  });
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#/dashboard';
    if (hash !== currentHash) navigate(hash, { noAnim: false });
  });

  const initial = window.location.hash || '#/dashboard';
  navigate(initial, { noAnim: true });
}
