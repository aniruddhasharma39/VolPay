const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const stage1Core = `
                            <div id="stage-1-core-db" style="display: none;">
                                <div style="margin-bottom: 16px; font-size: 0.875rem; color: var(--text-muted);">Select tables and fields from enterprise databases to construct your core report.</div>
                                
                                <div style="display: flex; gap: 24px; margin-bottom: 24px;">
                                    <!-- Core Banking DB -->
                                    <div style="flex: 1; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-panel); display: flex; flex-direction: column; height: 500px;">
                                        <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-workspace); border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                            <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                                <i data-lucide="database" style="color: #2563eb;"></i> CORE BANKING
                                            </div>
                                        </div>
                                        <div style="padding: 12px; border-bottom: 1px solid var(--border-color);">
                                            <input type="text" class="form-control" id="search-core-banking" placeholder="Search tables or fields..." style="width: 100%;">
                                        </div>
                                        <div class="db-tree-container" id="tree-core-banking" style="flex: 1; overflow-y: auto; padding: 12px;">
                                            <!-- JS populated -->
                                        </div>
                                    </div>

                                    <!-- Payment Engine DB -->
                                    <div style="flex: 1; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-panel); display: flex; flex-direction: column; height: 500px;">
                                        <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-workspace); border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                            <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                                <i data-lucide="server" style="color: #ea580c;"></i> PAYMENT ENGINE
                                            </div>
                                        </div>
                                        <div style="padding: 12px; border-bottom: 1px solid var(--border-color);">
                                            <input type="text" class="form-control" id="search-payment-engine" placeholder="Search tables or fields..." style="width: 100%;">
                                        </div>
                                        <div class="db-tree-container" id="tree-payment-engine" style="flex: 1; overflow-y: auto; padding: 12px;">
                                            <!-- JS populated -->
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Selected Fields Tray -->
                                <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-panel);">
                                    <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-workspace); display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                        <div style="font-weight: 600;">Selected Fields (<span id="core-db-selected-count">0</span>)</div>
                                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.75rem;" onclick="window.appBuilderManager.clearAllFields()">Clear All</button>
                                    </div>
                                    <div id="core-db-selected-tray" style="padding: 16px; display: flex; flex-wrap: wrap; gap: 8px; min-height: 60px;">
                                        <div style="color: var(--text-muted); font-size: 0.875rem; font-style: italic; width: 100%; text-align: center; margin-top: 8px;" id="core-db-empty-msg">Select fields from the databases above...</div>
                                    </div>
                                </div>
                            </div>
`;

const target1 = '<div class="stage-content">\n                            <div id="stage-1-datasets" style="display: block;">';
html = html.replace(target1, '<div class="stage-content">\n' + stage1Core + '\n                            <div id="stage-1-datasets" style="display: block;">');

const stage2Core = `
                            <div id="stage-2-core-arrange" style="display: none;">
                                <div style="margin-bottom: 16px; font-size: 0.875rem; color: var(--text-muted);">Arrange the sequence of the selected fields and group them. You can drag and drop to reorder.</div>
                                <div style="display: flex; gap: 24px;">
                                    <div style="flex: 2;">
                                        <div style="font-weight: 600; margin-bottom: 12px; font-size: 0.875rem;">Field Sequence (Drag to Reorder)</div>
                                        <div id="core-arrange-list" style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-panel); min-height: 200px; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                                            <!-- List items with drag handles -->
                                        </div>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; margin-bottom: 12px; font-size: 0.875rem;">Grouping</div>
                                        <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-panel); padding: 16px;">
                                            <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0;">Select fields to group by:</p>
                                            <div id="core-grouping-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
                                                <!-- Checkboxes for grouping -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
`;

const target2 = '<div class="stage-content">\n                            <div class="field-explorer">';
html = html.replace(target2, '<div class="stage-content">\n' + stage2Core + '\n                            <div class="field-explorer" id="stage-2-field-explorer">');

fs.writeFileSync('index.html', html);
console.log('Modified index.html');
