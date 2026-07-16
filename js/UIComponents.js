// UI Components: Toasts, Modals, Notifications, Drag&Drop

class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px;';
        document.body.appendChild(this.container);
    }

    show(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            font-weight: 500;
            font-size: 0.875rem;
            transform: translateY(100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        let icon = 'check-circle';
        if (type === 'error') icon = 'alert-circle';
        if (type === 'info') icon = 'info';

        toast.innerHTML = `<i data-lucide="${icon}"></i> ${message}`;
        this.container.appendChild(toast);
        lucide.createIcons();

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        // Animate out
        setTimeout(() => {
            toast.style.transform = 'translateY(10px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

class ModalManager {
    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
            z-index: 9998; display: none; align-items: center; justify-content: center;
        `;
        document.body.appendChild(this.overlay);

        this.modal = document.createElement('div');
        this.modal.style.cssText = `
            background: white; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            width: 480px; max-width: 90vw; overflow: hidden; transform: scale(0.95); opacity: 0;
            transition: all 0.2s ease-out;
        `;
        this.overlay.appendChild(this.modal);
    }

    show(title, content, actions = []) {
        this.overlay.style.display = 'flex';
        
        let actionsHtml = actions.map((a, i) => 
            `<button class="btn ${a.primary ? 'btn-primary' : 'btn-secondary'}" id="modal-btn-${i}">${a.label}</button>`
        ).join('');

        this.modal.innerHTML = `
            <div style="padding: 24px; border-bottom: 1px solid #e2e8f0;">
                <h3 style="margin:0; font-size: 1.25rem; font-weight: 600;">${title}</h3>
            </div>
            <div style="padding: 24px; color: #64748b; line-height: 1.5; font-size: 0.95rem;">
                ${content}
            </div>
            <div style="padding: 16px 24px; background: #f8fafc; display: flex; justify-content: flex-end; gap: 12px;">
                ${actionsHtml}
            </div>
        `;

        actions.forEach((a, i) => {
            document.getElementById(`modal-btn-${i}`).addEventListener('click', () => {
                if (a.onClick) a.onClick();
                this.hide();
            });
        });

        requestAnimationFrame(() => {
            this.modal.style.transform = 'scale(1)';
            this.modal.style.opacity = '1';
        });
    }

    hide() {
        this.modal.style.transform = 'scale(0.95)';
        this.modal.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 200);
    }
}

class NotificationManager {
    static add(title, message, type = 'info') {
        const state = window.appState.get();
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            time: new Date().toISOString(),
            read: false
        };
        window.appState.update({ notifications: [notification, ...state.notifications] });
        
        // Also add to activity log
        window.appState.update({ 
            activityLog: [{
                id: Date.now() + 1,
                action: title,
                detail: message,
                time: new Date().toISOString()
            }, ...state.activityLog] 
        });
    }
}

class DragDropManager {
    static init(containerSelector, onReorder) {
        let draggedItem = null;
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.addEventListener('dragstart', (e) => {
            if (!e.target.classList.contains('draggable-item')) return;
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
            setTimeout(() => draggedItem.style.opacity = '0.5', 0);
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const currentItem = document.querySelector('.draggable-item[style*="opacity: 0.5"]');
            if (currentItem) {
                if (afterElement == null) {
                    container.appendChild(currentItem);
                } else {
                    container.insertBefore(currentItem, afterElement);
                }
            }
        });

        container.addEventListener('dragend', (e) => {
            if (draggedItem) {
                draggedItem.style.opacity = '1';
                draggedItem = null;
                if (onReorder) {
                    const newOrder = Array.from(container.querySelectorAll('.draggable-item')).map(el => el.dataset.id);
                    onReorder(newOrder);
                }
            }
        });
    }

    static getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not([style*="opacity: 0.5"])')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

window.appToast = new ToastManager();
window.appModal = new ModalManager();
window.appNotification = NotificationManager;
window.appDragDrop = DragDropManager;
