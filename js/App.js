// App Initialization

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI logic
    window.appBuilderManager.init();
    
    // Add ids to buttons for BuilderManager
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const view = item.getAttribute('onclick').match(/'([^']+)'/)[1];
            switchView(view);
            e.preventDefault();
        });
    });
    
    // Remove inline onclick from HTML for better separation if possible, but for this prototype 
    // switchView is globally available via index.html script tag.
    
    // Role Selector Logic
    const roleSelector = document.getElementById('user-role-selector');
    if (roleSelector) {
        roleSelector.addEventListener('change', (e) => {
            const role = e.target.value;
            const navBuilder = document.getElementById('nav-builder');
            const roleText = document.getElementById('current-user-role-text');
            
            if (role === 'admin') {
                if (roleText) roleText.innerText = 'Admin';
                if (navBuilder) navBuilder.style.display = 'flex';
            } else if (role === 'builder') {
                if (roleText) roleText.innerText = 'Report Builder';
                if (navBuilder) navBuilder.style.display = 'flex';
            } else if (role === 'viewer') {
                if (roleText) roleText.innerText = 'Viewer';
                if (navBuilder) navBuilder.style.display = 'none';
                
                // Force exit builder if active
                if (document.getElementById('view-builder').classList.contains('active')) {
                    if (typeof switchView === 'function') switchView('catalogue');
                }
            }
            window.appToast.show('Switched to ' + role + ' role', 'info');
        });
    }

    // Initial Render of state
    window.appState.notify();
    
    window.appToast.show('Application loaded successfully', 'success');
});
