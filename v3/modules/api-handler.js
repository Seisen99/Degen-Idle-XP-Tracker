// ====================
// MODULE 5: API INTERCEPTORS & HANDLERS
// ====================

// Dependencies: Constants, EfficiencyCalc, ItemDataEngine, State (loaded via @require)

const APIHandler = {
    characterId: null,
    lastAllDataUpdate: 0,
    modalObserver: null,
    modalObserverTimeout: null,
    
    /**
     * Main response handler
     * @param {string} url - Request URL
     * @param {Object} json - Response data
     */
    handleResponse(url, json) {
        try {
            // Extract character ID from URL
            const charIdMatch = url.match(/\/([a-f0-9-]{36})\//);
            if (charIdMatch) {
                const isPersonalEndpoint = url.includes('/skills') || 
                                          url.includes('/tasks/active/') || 
                                          url.includes('/all-data');
                
                if (isPersonalEndpoint) {
                    const newCharId = charIdMatch[1];
                    
                    // Detect character change (not first load)
                    if (this.characterId && this.characterId !== newCharId) {
                        // Character switched - full reset required
                        console.log(`[APIHandler] Character changed: ${this.characterId} → ${newCharId}`);
                        State.resetForCharacter(newCharId);
                        ItemDataEngine.reset();
                        EfficiencyCalc.reset();
                    } else if (!this.characterId) {
                        // First load - just initialize state, don't reset data engines
                        // They will be populated by handleAllData()
                        console.log(`[APIHandler] Initial character detected: ${newCharId}`);
                        State.resetForCharacter(newCharId);
                    }
                    
                    this.characterId = newCharId;
                }
            }
            
            // Route to appropriate handler based on endpoint
            if (url.includes('/skills')) {
                this.handleSkills(json);
            } else if (url.includes('/tasks/active/') || url.includes('/batch/periodic-status/')) {
                this.handleActiveTasks(json, url);
            } else if (url.includes('/all-data')) {
                this.handleAllData(json);
            } else if (url.includes('/tasks/calculate')) {
                // Used only for click detection
                this.handleCalculate(json, url);
            } else if (url.includes('/tasks/requirements/')) {
                // Used only for click detection
                this.handleRequirements(json, url);
            }
        } catch (error) {
            console.error('[APIHandler] Error handling response:', error);
        }
    },
    
    /**
     * Handle skills endpoint response
     * @param {Object} data - Skills data
     */
    handleSkills(data) {
        if (!data) return;
        
        console.log('[APIHandler] Processing skills data');
        
        Constants.SKILLS.forEach(skill => {
            if (data[skill] !== undefined) {
                State.updateSkillXP(skill, data[skill]);
            }
        });
        
        State.triggerUIUpdate();
    },
    
    /**
     * Handle active tasks endpoint response
     * @param {Object|Array} data - Active tasks data
     * @param {string} url - Request URL
     */
    handleActiveTasks(data, url) {
        // Handle different response formats
        const tasks = url.includes('/batch/periodic-status/') 
            ? data?.data?.activeTasks 
            : data;
        
        if (!Array.isArray(tasks)) {
            console.warn('[APIHandler] Invalid active tasks data');
            return;
        }
        
        console.log('[APIHandler] Processing active tasks:', tasks.length);
        State.updateActiveTasks(tasks);
    },
    
    /**
     * Handle all-data endpoint response
     * @param {Object} data - Complete character data
     */
    handleAllData(data) {
        if (!data?.data) {
            console.warn('[APIHandler] Invalid all-data response');
            return;
        }
        
        const allData = data.data;
        console.log('[APIHandler] Processing all-data');
        
        // Update efficiency bonuses
        EfficiencyCalc.updateFromAllData(allData);
        
        // Update inventory
        ItemDataEngine.updateInventory(allData);
        
        // Update skills if present
        if (allData.skills) {
            this.handleSkills(allData.skills);
        }
        
        // Update active tasks if present
        if (allData.activeTasks) {
            this.handleActiveTasks(allData.activeTasks, '/all-data');
        }
        
        this.lastAllDataUpdate = Date.now();
        console.log('[APIHandler] All-data processed successfully');
        
        // Trigger UI update
        State.triggerUIUpdate();
    },
    
    /**
     * Handle calculate endpoint (for click detection only)
     * @param {Object} data - Calculate response
     * @param {string} url - Request URL
     */
    handleCalculate(data, url) {
        console.log('[APIHandler] /calculate detected - waiting for modal to appear...');
        
        // Try immediate detection first
        const immediateItem = this.detectClickedItem();
        const immediateSkill = this.detectCurrentSkill();
        
        if (immediateItem && immediateSkill) {
            console.log(`[APIHandler] Immediate detection successful: ${immediateItem} (${immediateSkill})`);
            const itemData = ItemDataEngine.getItemData(immediateItem);
            if (itemData) {
                State.updatePreview(itemData);
                return;
            }
        }
        
        // If immediate detection failed, use MutationObserver to wait for modal
        console.log('[APIHandler] Starting MutationObserver to detect modal...');
        this.waitForModalAndDetect();
    },
    
    /**
     * Wait for modal to appear using MutationObserver
     */
    waitForModalAndDetect() {
        // Clean up any existing observer
        if (this.modalObserver) {
            this.modalObserver.disconnect();
            this.modalObserver = null;
        }
        if (this.modalObserverTimeout) {
            clearTimeout(this.modalObserverTimeout);
            this.modalObserverTimeout = null;
        }
        
        let detectionAttempts = 0;
        const maxAttempts = 30; // Max 3 seconds (30 * 100ms)
        
        // Create observer to detect DOM changes
        this.modalObserver = new MutationObserver((mutations) => {
            detectionAttempts++;
            
            // Try to detect item and skill
            const itemName = this.detectClickedItem();
            const skillName = this.detectCurrentSkill();
            
            if (itemName && skillName) {
                console.log(`[APIHandler] Modal detected after ${detectionAttempts} attempts: ${itemName} (${skillName})`);
                
                // Update preview with client-side calculation
                const itemData = ItemDataEngine.getItemData(itemName);
                if (itemData) {
                    State.updatePreview(itemData);
                    
                    // Success - clean up observer
                    this.modalObserver.disconnect();
                    this.modalObserver = null;
                    clearTimeout(this.modalObserverTimeout);
                    this.modalObserverTimeout = null;
                } else {
                    console.warn(`[APIHandler] Item data not found for: ${itemName}`);
                }
            }
            
            // Give up after max attempts
            if (detectionAttempts >= maxAttempts) {
                console.warn(`[APIHandler] Modal detection timeout after ${detectionAttempts} attempts`);
                this.modalObserver.disconnect();
                this.modalObserver = null;
            }
        });
        
        // Start observing document body for changes
        this.modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'] // Watch for visibility changes
        });
        
        // Set timeout to clean up observer after 3 seconds
        this.modalObserverTimeout = setTimeout(() => {
            if (this.modalObserver) {
                console.warn('[APIHandler] Modal observer timeout - cleaning up');
                this.modalObserver.disconnect();
                this.modalObserver = null;
            }
        }, 3000);
    },
    
    /**
     * Handle requirements endpoint (for click detection only)
     * @param {Object} data - Requirements response
     * @param {string} url - Request URL
     */
    handleRequirements(data, url) {
        // Extract skill and item from URL
        const match = url.match(/\/tasks\/requirements\/([^\/]+)\/([^?]+)/);
        if (!match) return;
        
        const skillFromUrl = match[1].toLowerCase();
        const itemName = decodeURIComponent(match[2]);
        
        console.log(`[APIHandler] User clicked on: ${itemName} (${skillFromUrl})`);
        
        // Update preview with client-side calculation
        const itemData = ItemDataEngine.getItemData(itemName);
        if (itemData) {
            State.updatePreview(itemData);
        }
    },
    
    /**
     * Detect clicked item from DOM
     * @returns {string|null}
     */
    detectClickedItem() {
        // Method 1: Try to find item name from modal title (degenidle.com specific)
        // Look for h2 with specific classes in the modal
        const modalTitle = document.querySelector('h2.text-xl.font-bold.text-white');
        if (modalTitle) {
            // Get text content, excluding SVG content
            const textContent = Array.from(modalTitle.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join('');
            
            if (textContent) {
                console.log('[APIHandler] Detected item from modal title:', textContent);
                return textContent;
            }
        }
        
        // Method 2: Try to find from image alt attribute in modal
        const modalImages = document.querySelectorAll('img[alt]');
        for (const img of modalImages) {
            const alt = img.getAttribute('alt');
            if (alt && alt !== '' && !alt.includes('icon') && !alt.includes('avatar')) {
                // Check if parent container is visible (modal is open)
                const rect = img.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    console.log('[APIHandler] Detected item from image alt:', alt);
                    return alt;
                }
            }
        }
        
        // Method 3: Try to extract from image URL
        const modalImageWithSrc = document.querySelector('img[src*="cdn.degendungeon.com"]');
        if (modalImageWithSrc) {
            const src = modalImageWithSrc.getAttribute('src');
            const match = src.match(/\/([^\/]+)\.(png|jpg|webp)/);
            if (match) {
                // Convert filename to proper case (e.g., "shadowvine.png" -> "Shadowvine")
                const itemName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                console.log('[APIHandler] Detected item from image URL:', itemName);
                return itemName;
            }
        }
        
        // Method 4: Fallback to old selectors
        const possibleSelectors = [
            '.item-name.active',
            '.selected-item',
            '[data-item-name]:hover',
            '.task-item:hover .item-name'
        ];
        
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const itemName = element.textContent?.trim() || 
                                element.dataset?.itemName || 
                                element.getAttribute('data-item');
                if (itemName) {
                    console.log('[APIHandler] Detected item from fallback selector:', itemName);
                    return itemName;
                }
            }
        }
        
        console.warn('[APIHandler] Could not detect clicked item from DOM');
        return null;
    },
    
    /**
     * Detect current skill from DOM
     * @returns {string|null}
     */
    detectCurrentSkill() {
        // Method 1: Find skill from modal with border-yellow-400/50 or similar highlighted div
        // This div contains the skill name for the current activity
        const skillDivs = document.querySelectorAll('div.text-\\[\\#8B8D91\\].text-\\[10px\\]');
        for (const div of skillDivs) {
            const text = div.textContent?.trim()?.toLowerCase();
            if (text && Constants.SKILLS.includes(text)) {
                // Check if this div is in a visible container (modal is open)
                const parent = div.closest('div.bg-\\[\\#1E2330\\]');
                if (parent) {
                    const rect = parent.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        console.log('[APIHandler] Detected skill from modal:', text);
                        return text;
                    }
                }
            }
        }
        
        // Method 2: Try to extract from image URL (e.g., /Gathering/shadowvine.png -> gathering)
        const modalImageWithSrc = document.querySelector('img[src*="cdn.degendungeon.com"]');
        if (modalImageWithSrc) {
            const src = modalImageWithSrc.getAttribute('src');
            // Match patterns like /Gathering/, /Mining/, /Fishing/, etc.
            const match = src.match(/\/(Mining|Woodcutting|Tracking|Fishing|Gathering|Herbalism|Forging|Leatherworking|Tailoring|Crafting|Cooking|Alchemy|Woodcrafting)\//i);
            if (match) {
                const skillName = match[1].toLowerCase();
                if (Constants.SKILLS.includes(skillName)) {
                    console.log('[APIHandler] Detected skill from image URL:', skillName);
                    return skillName;
                }
            }
        }
        
        // Method 3: Try to detect from URL hash
        const urlMatch = window.location.hash.match(/#skill=([^&]+)/);
        if (urlMatch) {
            const skill = urlMatch[1].toLowerCase();
            if (Constants.SKILLS.includes(skill)) {
                console.log('[APIHandler] Detected skill from URL hash:', skill);
                return skill;
            }
        }
        
        // Method 4: Fallback to old selectors
        const possibleSelectors = [
            '.skill-tab.active',
            '.selected-skill',
            '[data-skill].active',
            '.current-skill'
        ];
        
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const skillName = element.textContent?.trim()?.toLowerCase() || 
                                 element.dataset?.skill?.toLowerCase() || 
                                 element.getAttribute('data-skill')?.toLowerCase();
                if (skillName && Constants.SKILLS.includes(skillName)) {
                    console.log('[APIHandler] Detected skill from fallback selector:', skillName);
                    return skillName;
                }
            }
        }
        
        console.warn('[APIHandler] Could not detect current skill from DOM');
        return null;
    },
    
    /**
     * Setup API interceptors
     */
    setupInterceptors() {
        console.log('[APIHandler] Setting up API interceptors');
        
        // Hook fetch API
        const originalFetch = window.fetch;
        window.fetch = async function(input, init) {
            const response = await originalFetch.apply(this, arguments);
            
            try {
                const url = (typeof input === 'string') ? input : (input?.url || '');
                
                if (url.startsWith(Constants.API_ROOT)) {
                    // Clone response to read it without consuming
                    const clone = response.clone();
                    clone.json()
                        .then(json => APIHandler.handleResponse(url, json))
                        .catch(err => {
                            // Silently ignore JSON parse errors
                        });
                }
            } catch(error) {
                // Silently catch any errors
            }
            
            return response;
        };
        
        // Hook XMLHttpRequest
        const XHR = window.XMLHttpRequest;
        function newXHR() {
            const realXHR = new XHR();
            
            realXHR.addEventListener('readystatechange', function() {
                try {
                    if (realXHR.readyState === 4 && realXHR.responseURL?.startsWith(Constants.API_ROOT)) {
                        try {
                            const json = JSON.parse(realXHR.responseText);
                            APIHandler.handleResponse(realXHR.responseURL, json);
                        } catch(error) {
                            // Silently ignore JSON parse errors
                        }
                    }
                } catch(error) {
                    // Silently catch any errors
                }
            }, false);
            
            return realXHR;
        }
        
        newXHR.prototype = XHR.prototype;
        window.XMLHttpRequest = newXHR;
        
        console.log('[APIHandler] API interceptors installed');
    },
    
    /**
     * Request /all-data manually
     */
    async requestAllData() {
        if (!this.characterId) {
            console.warn('[APIHandler] No character ID, cannot request all-data');
            return;
        }
        
        try {
            const url = `${Constants.API_ROOT}characters/${this.characterId}/all-data`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                this.handleAllData(data);
            }
        } catch (error) {
            console.error('[APIHandler] Failed to request all-data:', error);
        }
    }
};

// Expose globally for use in other modules and main script
// Note: In @require scripts, we must use window directly as unsafeWindow is not available
window.APIHandler = APIHandler;