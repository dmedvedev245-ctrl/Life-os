let activeModal = null;

export function openModal({ title, content, actions = [] }) {
  closeModal();

  const root = document.getElementById('modal-root');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-title">${title}</div>
    <div class="modal-body"></div>
    <div class="modal-actions"></div>
  `;

  const body = modal.querySelector('.modal-body');
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  const actionsEl = modal.querySelector('.modal-actions');
  actions.forEach(({ label, cls = 'btn-secondary', onClick }) => {
    const btn = document.createElement('button');
    btn.className = `btn ${cls} btn-full`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (onClick) onClick(modal);
    });
    actionsEl.appendChild(btn);
  });

  overlay.appendChild(modal);
  root.appendChild(overlay);
  root.style.pointerEvents = 'all';

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', onEsc);

  activeModal = { overlay, modal };
  return modal;
}

function onEsc(e) {
  if (e.key === 'Escape') closeModal();
}

export function closeModal() {
  if (!activeModal) return;
  const { overlay, modal } = activeModal;
  overlay.classList.add('closing');
  modal.classList.add('closing');
  setTimeout(() => {
    overlay.remove();
    const root = document.getElementById('modal-root');
    if (root) root.style.pointerEvents = 'none';
  }, 200);
  document.removeEventListener('keydown', onEsc);
  activeModal = null;
}

export function getModalBody(modal) {
  return modal.querySelector('.modal-body');
}
