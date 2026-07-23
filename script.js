// Navigation and View Switching
function switchView(viewName) {
    // Update Navigation Active State
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (viewName === 'builder') {
        const state = window.appState.get();
        document.getElementById('nav-builder-main').classList.add('active');
        
        // ensure submenu is open
        const submenu = document.getElementById('nav-builder-submenu');
        if (submenu) submenu.style.display = 'flex'; // our new css makes it flex
        
        if (state.currentBuilder.mode === 'core') {
            const el = document.getElementById('nav-core-report');
            if (el) el.classList.add('active');
        } else {
            const el = document.getElementById('nav-template-report');
            if (el) el.classList.add('active');
        }
    } else {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${viewName}'`)) {
                item.classList.add('active');
            }
        });
        // collapse submenu if navigating away
        const submenu = document.getElementById('nav-builder-submenu');
        if (submenu) submenu.style.display = 'none';
    }

    // Update Views
    document.querySelectorAll('.view-container').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none'; // explicitly hide to override inline flex
    });
    const targetView = document.getElementById('view-' + viewName);
    if(targetView) {
        targetView.classList.add('active');
        if (viewName === 'builder') {
            targetView.style.display = 'flex';
        } else {
            targetView.style.display = 'block';
        }
    }

    // Update Page Title and Summary Panel visibility
    const titleElement = document.getElementById('page-title');
    const summaryPanel = document.getElementById('summary-panel');
    
    if (viewName === 'builder') {
        const state = window.appState.get();
        titleElement.textContent = state.currentBuilder.mode === 'core' ? 'Create New Report' : 'Clone Existing Report';
        if (summaryPanel) summaryPanel.style.display = 'flex';
    } else if (viewName === 'catalogue') {
        titleElement.textContent = 'Report Catalogue';
        if (summaryPanel) summaryPanel.style.display = 'none';
    } else if (viewName === 'centre') {
        titleElement.textContent = 'Reports Centre';
        if (summaryPanel) summaryPanel.style.display = 'none';
    }
}

function toggleStage(stageNumber) {
    // For this prototype, we'll allow multiple open stages, or auto-close others
    // Let's implement one-expanded-at-a-time (Accordion)
    
    // Check if the clicked stage is already active
    const clickedStage = document.getElementById('stage-' + stageNumber);
    const isActive = clickedStage.classList.contains('active');

    // Close all stages
    for (let i = 1; i <= 5; i++) {
        const stage = document.getElementById('stage-' + i);
        if(stage) {
            stage.classList.remove('active');
            const icon = document.getElementById('icon-stage-' + i);
            if(icon) {
                icon.setAttribute('data-lucide', 'chevron-right');
            }
        }
    }

    // If it wasn't active, open it
    if (!isActive) {
        clickedStage.classList.add('active');
        const icon = document.getElementById('icon-stage-' + stageNumber);
        if(icon) {
            icon.setAttribute('data-lucide', 'chevron-down');
        }
        
        // Scroll slightly to bring it into view if needed
        setTimeout(() => {
            clickedStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    lucide.createIcons();
}

// Dataset Selection
document.querySelectorAll('.dataset-card').forEach(card => {
    card.addEventListener('click', function(e) {
        // Prevent triggering if clicking star
        if(e.target.closest('[data-lucide="star"]')) return;
        
        document.querySelectorAll('.dataset-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
    });
});

// Note: Advanced Drag-and-Drop and complex filtering logic 
// would require a JS framework or library (like SortableJS) in a real implementation.
// The CSS and HTML structure provided simulates the visual appearance of these interactions.

// Additional UI Interactivity

// Catalogue Filter Chips
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function() {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
    });
});

// Field Explorer Folders
document.querySelectorAll('.folder-item').forEach(folder => {
    folder.addEventListener('click', function() {
        if (this.style.fontWeight === '600') return; // Skip the "Categories" header
        document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
        this.classList.add('active');
    });
});

// Dummy Button Feedback
document.querySelectorAll('.btn, .icon-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if(this.classList.contains('nav-item')) return; // handled by switchView
        
        // Add a small ripple or click effect for demonstration
        if (this.classList.contains('icon-btn-primary') && this.querySelector('[data-lucide="play"]')) {
            alert('Initiating Report Execution...');
        }
    });
});

// Add basic CSS animation for loader
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

