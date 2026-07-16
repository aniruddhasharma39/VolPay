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
    
    // Initial Render of state
    window.appState.notify();
    
    window.appToast.show('Application loaded successfully', 'success');
});
