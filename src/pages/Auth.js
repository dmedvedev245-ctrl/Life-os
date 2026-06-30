import { supabase, loadFromCloud } from '../supabase.js';
import { navigate } from '../router.js';
import { toast } from '../components/Toast.js';
import { renderNav } from '../components/Nav.js';

export class AuthPage {
  constructor() { this.mode = 'login'; }

  render() {
    const el = document.createElement('div');
    el.className = 'auth-page';
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const isLogin = this.mode === 'login';
    this.el.innerHTML = `
      <div class="auth-container">
        <div class="auth-logo">Life OS</div>
        <div class="auth-subtitle">Твоя операционная система жизни</div>

        <div class="auth-card">
          <h2 class="auth-title">${isLogin ? 'Вход' : 'Регистрация'}</h2>

          <div class="input-group">
            <label class="input-label">Email</label>
            <input class="input" id="auth-email" type="email" placeholder="your@email.com" autocomplete="email">
          </div>

          <div class="input-group">
            <label class="input-label">Пароль</label>
            <input class="input" id="auth-password" type="password" placeholder="Минимум 6 символов"
              autocomplete="${isLogin ? 'current-password' : 'new-password'}">
          </div>

          ${!isLogin ? `
            <div class="input-group">
              <label class="input-label">Подтвердите пароль</label>
              <input class="input" id="auth-password2" type="password" placeholder="Повторите пароль">
            </div>
          ` : ''}

          <button class="btn btn-primary btn-full" id="auth-submit">
            ${isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>

          <div class="auth-switch">
            ${isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            <button class="btn-link" id="auth-mode-switch">
              ${isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.el.querySelector('#auth-submit').addEventListener('click', () => this.submit());
    this.el.querySelector('#auth-mode-switch').addEventListener('click', () => {
      this.mode = this.mode === 'login' ? 'register' : 'login';
      this.draw();
    });

    this.el.querySelector('#auth-email').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.el.querySelector('#auth-password').focus();
    });
    this.el.querySelector('#auth-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.submit();
    });

    setTimeout(() => this.el.querySelector('#auth-email')?.focus(), 100);
  }

  async submit() {
    const email = this.el.querySelector('#auth-email').value.trim();
    const password = this.el.querySelector('#auth-password').value;
    const btn = this.el.querySelector('#auth-submit');

    if (!email || !password) { toast('Заполните все поля'); return; }
    if (password.length < 6) { toast('Пароль минимум 6 символов'); return; }

    if (this.mode === 'register') {
      const p2 = this.el.querySelector('#auth-password2').value;
      if (password !== p2) { toast('Пароли не совпадают'); return; }
    }

    btn.disabled = true;
    btn.textContent = 'Загрузка...';

    try {
      let error;
      if (this.mode === 'login') {
        const res = await supabase.auth.signInWithPassword({ email, password });
        error = res.error;
      } else {
        const res = await supabase.auth.signUp({ email, password });
        error = res.error;
      }
      if (error) throw error;

      const cloudData = await loadFromCloud();
      if (cloudData) localStorage.setItem('life_os', JSON.stringify(cloudData));

      renderNav();
      navigate('#/dashboard');
      toast(this.mode === 'login' ? 'Добро пожаловать! 👋' : 'Аккаунт создан! 🎉');
    } catch (err) {
      const msg = err.message?.includes('Invalid login') ? 'Неверный email или пароль'
        : err.message?.includes('already registered') ? 'Email уже зарегистрирован'
        : err.message || 'Ошибка входа';
      toast(msg);
      btn.disabled = false;
      btn.textContent = this.mode === 'login' ? 'Войти' : 'Создать аккаунт';
    }
  }
}
