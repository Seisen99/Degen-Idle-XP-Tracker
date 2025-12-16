// ====================
// MODULE 5: API HANDLER (Polling-based + Preview interception)
// ====================

// Dependencies: Constants, ItemDataEngine, State (loaded via @require)

const APIHandler = {
    // === CONFIG ===
    API_ROOT: 'https://api-v1.degenidle.com/api/',
    POLL_INTERVAL: 60000, // 60 seconds
    RETRY_DELAY: 5000,    // 5 seconds
    MAX_RETRIES: 3,
    
    // === STATE ===
    authToken: null,
    characterId: null,
    characterName: null,
    characterList: [],
    pollTimer: null,
    originalFetch: null,
    characterObserver: null,
    modalObserver: null,
    modalObserverTimeout: null,
    isInitialized: false,
    lastPollTime: 0,
    
    // === LIFECYCLE ===
    
    /**
     * Initialize the API handler
     */
    init() {
        if (this.isInitialized) {
            console.warn('[APIHandler] Already initialized');
            return;
        }
        
        console.log('[APIHandler] Initializing polling-based API handler');
        
        // Store original fetch before hooking
        this.originalFetch = window.fetch;
        
        // Setup token interception + response interception for preview
        this.setupInterceptors();
        
        this.isInitialized = true;
        console.log('[APIHandler] Initialization complete, waiting for token...');
    },
    
    // === INTERCEPTORS ===
    
    /**
     * Setup interceptors to capture auth token and preview responses
     */
    setupInterceptors() {
        const self = this;
        
        // Hook fetch to capture Authorization header AND intercept /tasks/calculate responses
        window.fetch = async function(...args) {
            const [url, options] = args;
            const urlStr = typeof url === 'string' ? url : url?.url || '';
            
            // Capture Authorization header from DegenIdle API calls
            if (urlStr.includes('api-v1.degenidle.com') && options?.headers) {
                let authHeader = null;
                
                if (options.headers instanceof Headers) {
                    authHeader = options.headers.get('Authorization');
                } else if (typeof options.headers === 'object') {
                    authHeader = options.headers['Authorization'] || options.headers['authorization'];
                }
                
                if (authHeader) {
                    self.onTokenCaptured(authHeader);
                }
            }
            
            // Make the actual request
            const response = await self.originalFetch.apply(window, args);
            
            // Intercept /tasks/calculate response for preview
            if (urlStr.includes('/tasks/calculate')) {
                try {
                    const clone = response.clone();
                    clone.json().then(json => {
                        self.handleCalculate(json, urlStr);
                    }).catch(() => {});
                } catch (e) {}
            }
            
            return response;
        };
        
        // Hook XMLHttpRequest to capture Authorization header
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._degenIdleUrl = url;
            return originalXHROpen.apply(this, [method, url, ...rest]);
        };
        
        XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
            if (name.toLowerCase() === 'authorization' && this._degenIdleUrl?.includes('api-v1.degenidle.com')) {
                self.onTokenCaptured(value);
            }
            return originalXHRSetRequestHeader.apply(this, arguments);
        };
        
        // Also intercept XHR responses for /tasks/calculate
        XMLHttpRequest.prototype.send = function(...args) {
            const xhr = this;
            
            xhr.addEventListener('readystatechange', function() {
                if (xhr.readyState === 4 && xhr._degenIdleUrl?.includes('/tasks/calculate')) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        self.handleCalculate(json, xhr._degenIdleUrl);
                    } catch (e) {}
                }
            });
            
            return originalXHRSend.apply(this, args);
        };
        
        console.log('[APIHandler] Interceptors installed (token + preview)');
    },
    
    /**
     * Called when auth token is captured
     * @param {string} token - The authorization token
     */
    async onTokenCaptured(token) {
        if (!token || token === this.authToken) return;
        
        const isFirstCapture = !this.authToken;
        this.authToken = token;
        
        console.log('[APIHandler] Token captured!');
        
        if (isFirstCapture) {
            // First token capture - start the initialization flow
            await this.onReady();
        }
    },
    
    /**
     * Called when token is ready - fetch character list and start polling
     */
    async onReady() {
        console.log('[APIHandler] Token ready, starting initialization...');
        
        try {
            // Fetch character list
            await this.fetchCharacterList();
            
            // Detect current character from DOM
            await this.detectAndSetCharacter();
            
            // Setup observer for character changes
            this.setupCharacterObserver();
            
            // Start polling if we have a character
            if (this.characterId) {
                await this.fetchAllData();
                this.startPolling();
            }
        } catch (error) {
            console.error('[APIHandler] Initialization error:', error);
            // Retry after delay
            setTimeout(() => this.onReady(), this.RETRY_DELAY);
        }
    },
    
    /**
     * Check if the handler is ready to make API calls
     */
    isReady() {
        return !!this.authToken && !!this.characterId;
    },
    
    // === CHARACTER DETECTION ===
    
    /**
     * Fetch list of all characters for the account
     */
    async fetchCharacterList() {
        console.log('[APIHandler] Fetching character list...');
        
        const data = await this.apiCall('characters/all');
        
        if (data?.characters && Array.isArray(data.characters)) {
            this.characterList = data.characters;
            console.log(`[APIHandler] Found ${this.characterList.length} character(s):`, 
                this.characterList.map(c => c.name).join(', '));
        } else {
            throw new Error('Invalid character list response');
        }
    },
    
    /**
     * Detect character name from DOM navbar
     * @returns {string|null} Character name or null
     */
    detectCharacterName() {
        // Method 1: Desktop - span with character name
        const nameSpan = document.querySelector('button span.hidden.md\\:inline.font-medium');
        if (nameSpan?.textContent) {
            return nameSpan.textContent.trim();
        }
        
        // Method 2: Mobile - avatar image alt attribute
        const avatarImg = document.querySelector('button img[alt][src*="cdn.degendungeon.com/Profiles"]');
        if (avatarImg?.alt) {
            return avatarImg.alt.trim();
        }
        
        // Method 3: Any button with profile image
        const profileButtons = document.querySelectorAll('button img[src*="Profiles"]');
        for (const img of profileButtons) {
            if (img.alt && img.alt.trim()) {
                return img.alt.trim();
            }
        }
        
        return null;
    },
    
    /**
     * Find character ID by name from the character list
     * @param {string} name - Character name
     * @returns {string|null} Character ID or null
     */
    findCharacterIdByName(name) {
        if (!name || !this.characterList.length) return null;
        
        const character = this.characterList.find(c => 
            c.name.toLowerCase() === name.toLowerCase()
        );
        
        return character?.id || null;
    },
    
    /**
     * Detect current character from DOM and set it
     */
    async detectAndSetCharacter() {
        // Try to detect character name from DOM
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const name = this.detectCharacterName();
            
            if (name) {
                const charId = this.findCharacterIdByName(name);
                
                if (charId) {
                    this.setCharacter(charId, name);
                    return;
                } else {
                    console.warn(`[APIHandler] Character "${name}" not found in list`);
                }
            }
            
            attempts++;
            await new Promise(r => setTimeout(r, 500));
        }
        
        // Fallback: use first character from list
        if (this.characterList.length > 0) {
            const firstChar = this.characterList[0];
            console.log(`[APIHandler] Using first character as fallback: ${firstChar.name}`);
            this.setCharacter(firstChar.id, firstChar.name);
        } else {
            throw new Error('No characters found');
        }
    },
    
    /**
     * Set the current character
     * @param {string} charId - Character ID
     * @param {string} charName - Character name
     */
    setCharacter(charId, charName) {
        const isSwitch = this.characterId && this.characterId !== charId;
        
        if (isSwitch) {
            console.log(`[APIHandler] Character switch: ${this.characterName} -> ${charName}`);
            
            // Reset state for new character
            State.resetForCharacter(charId);
            ItemDataEngine.reset();
            
            // Stop current polling
            this.stopPolling();
        }
        
        this.characterId = charId;
        this.characterName = charName;
        
        console.log(`[APIHandler] Active character: ${charName} (${charId})`);
        
        // If this was a switch, restart polling
        if (isSwitch) {
            this.fetchAllData().then(() => this.startPolling());
        }
    },
    
    /**
     * Setup observer to detect character switches in navbar
     */
    setupCharacterObserver() {
        // Find the navbar container
        const navbar = document.querySelector('div.h-16.px-4.flex');
        if (!navbar) {
            console.warn('[APIHandler] Navbar not found, will retry...');
            setTimeout(() => this.setupCharacterObserver(), 2000);
            return;
        }
        
        // Cleanup existing observer
        if (this.characterObserver) {
            this.characterObserver.disconnect();
        }
        
        this.characterObserver = new MutationObserver(() => {
            const newName = this.detectCharacterName();
            
            if (newName && newName !== this.characterName) {
                const newId = this.findCharacterIdByName(newName);
                
                if (newId) {
                    this.setCharacter(newId, newName);
                }
            }
        });
        
        this.characterObserver.observe(navbar, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        console.log('[APIHandler] Character observer installed');
    },
    
    // === POLLING ===
    
    /**
     * Start polling for data
     */
    startPolling() {
        if (this.pollTimer) {
            console.warn('[APIHandler] Polling already active');
            return;
        }
        
        console.log(`[APIHandler] Starting polling (interval: ${this.POLL_INTERVAL / 1000}s)`);
        
        this.pollTimer = setInterval(() => {
            this.fetchAllData().catch(err => {
                console.error('[APIHandler] Poll error:', err);
            });
        }, this.POLL_INTERVAL);
    },
    
    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            console.log('[APIHandler] Polling stopped');
        }
    },
    
    /**
     * Fetch all data for current character
     */
    async fetchAllData() {
        if (!this.characterId) {
            console.warn('[APIHandler] No character ID, cannot fetch data');
            return;
        }
        
        console.log('[APIHandler] Fetching all-data...');
        
        try {
            const data = await this.apiCall(`characters/${this.characterId}/all-data`);
            this.handleAllData(data);
            this.lastPollTime = Date.now();
        } catch (error) {
            console.error('[APIHandler] Failed to fetch all-data:', error);
            throw error;
        }
    },
    
    // === API HELPERS ===
    
    /**
     * Make an API GET request
     * @param {string} endpoint - API endpoint (without base URL)
     * @returns {Promise<Object>} Response data
     */
    async apiCall(endpoint) {
        if (!this.authToken) {
            throw new Error('Token not available');
        }
        
        const response = await this.originalFetch.call(window, `${this.API_ROOT}${endpoint}`, {
            headers: {
                'Authorization': this.authToken,
                'Accept': 'application/json',
                'Origin': 'https://degenidle.com',
                'Referer': 'https://degenidle.com/'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    },
    
    /**
     * Make an API POST request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} body - Request body
     * @returns {Promise<Object>} Response data
     */
    async apiPost(endpoint, body) {
        if (!this.authToken) {
            throw new Error('Token not available');
        }
        
        const response = await this.originalFetch.call(window, `${this.API_ROOT}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': this.authToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://degenidle.com',
                'Referer': 'https://degenidle.com/'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error(`API POST error: ${response.status}`);
        }
        
        return await response.json();
    },
    
    /**
     * Calculate task efficiency for a specific skill/item
     * @param {string} skillName - Skill name (e.g., "Tailoring")
     * @param {string} itemName - Item name (e.g., "Shadow Cloth")
     * @returns {Promise<Object>} Calculate response with timeReduction
     */
    async calculateTaskEfficiency(skillName, itemName) {
        if (!this.characterId) {
            throw new Error('No character ID');
        }
        
        return await this.apiPost('tasks/calculate', {
            characterId: this.characterId,
            skillName: skillName,
            itemName: itemName
        });
    },
    
    // === DATA HANDLERS ===
    
    /**
     * Handle all-data response
     * @param {Object} response - API response
     */
    handleAllData(response) {
        if (!response?.data) {
            console.warn('[APIHandler] Invalid all-data response');
            return;
        }
        
        const data = response.data;
        console.log('[APIHandler] Processing all-data');
        
        // Update inventory
        ItemDataEngine.updateInventory(data);
        
        // Update skills
        if (data.skills) {
            this.handleSkills(data.skills);
        }
        
        // Update active tasks
        if (data.activeTasks) {
            this.handleActiveTasks(data.activeTasks);
        }
        
        console.log('[APIHandler] All-data processed successfully');
        
        // Trigger UI update
        State.triggerUIUpdate();
    },
    
    /**
     * Handle skills data
     * @param {Object} skills - Skills XP data
     */
    handleSkills(skills) {
        if (!skills) return;
        
        console.log('[APIHandler] Processing skills data');
        
        Constants.SKILLS.forEach(skill => {
            if (skills[skill] !== undefined) {
                State.updateSkillXP(skill, skills[skill]);
            }
        });
    },
    
    /**
     * Handle active tasks data
     * @param {Array} tasks - Active tasks array
     */
    handleActiveTasks(tasks) {
        if (!Array.isArray(tasks)) {
            console.warn('[APIHandler] Invalid active tasks data');
            return;
        }
        
        console.log('[APIHandler] Processing active tasks:', tasks.length);
        State.updateActiveTasks(tasks);
    },
    
    // === PREVIEW (via /tasks/calculate interception) ===
    
    /**
     * Handle /tasks/calculate response for preview
     * Uses server-calculated data directly (modifiedActionTime includes all efficiency bonuses)
     * @param {Object} data - Calculate response from server
     * @param {string} url - Request URL
     */
    handleCalculate(data, url) {
        console.log('[APIHandler] /tasks/calculate detected');
        
        // Store the calculate data for use when we detect the item name
        this._lastCalculateData = data;
        
        // Try immediate detection
        const itemName = this.detectClickedItem();
        
        if (itemName) {
            console.log(`[APIHandler] Immediate detection: ${itemName}`);
            this.processPreviewWithServerData(itemName, data);
            return;
        }
        
        // If immediate detection failed, use MutationObserver to wait for modal
        console.log('[APIHandler] Starting MutationObserver to detect modal...');
        this.waitForModalAndDetect();
    },
    
    /**
     * Process preview using server data from /tasks/calculate
     * @param {string} itemName - Item name
     * @param {Object} serverData - Response from /tasks/calculate
     */
    processPreviewWithServerData(itemName, serverData) {
        // Get base item data from database
        const baseItemData = GameDB.getItemByName(itemName);
        if (!baseItemData) {
            console.warn(`[APIHandler] Item not found in database: ${itemName}`);
            return;
        }
        
        // Build preview data using SERVER-calculated values
        const previewData = {
            itemName: itemName,
            skill: baseItemData.skill,
            type: baseItemData.type,
            baseXp: serverData.expPerAction || baseItemData.baseXp,
            baseTime: serverData.originalActionTime || baseItemData.baseTime,
            levelRequired: baseItemData.levelRequired,
            img: baseItemData.img,
            // SERVER-CALCULATED efficiency data
            modifiedTime: serverData.modifiedActionTime,
            efficiency: serverData.timeReduction || 0,
            bonuses: serverData.bonuses || {},
            // Calculated fields using server data
            xpPerHour: serverData.modifiedActionTime > 0 
                ? Math.round((serverData.expPerAction * 3600) / serverData.modifiedActionTime) 
                : 0,
            // Requirements from server
            requirements: serverData.requirements || [],
            hasRequirements: serverData.requirements && serverData.requirements.length > 0,
            canCraft: serverData.requirements ? serverData.requirements.every(r => r.hasEnough) : true,
            maxActions: serverData.maxActions || 0,
            dropRate: serverData.dropRate || 1
        };
        
        console.log('[APIHandler] Preview data with server efficiency:', {
            item: itemName,
            baseTime: previewData.baseTime,
            modifiedTime: previewData.modifiedTime,
            efficiency: previewData.efficiency,
            bonuses: previewData.bonuses
        });
        
        State.updatePreview(previewData);
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
            
            // Try to detect item
            const itemName = this.detectClickedItem();
            
            if (itemName && this._lastCalculateData) {
                console.log(`[APIHandler] Modal detected after ${detectionAttempts} attempts: ${itemName}`);
                
                // Use server data for preview
                this.processPreviewWithServerData(itemName, this._lastCalculateData);
                
                // Success - clean up observer
                this.modalObserver.disconnect();
                this.modalObserver = null;
                clearTimeout(this.modalObserverTimeout);
                this.modalObserverTimeout = null;
                this._lastCalculateData = null;
            }
            
            // Give up after max attempts
            if (detectionAttempts >= maxAttempts) {
                console.warn(`[APIHandler] Modal detection timeout after ${detectionAttempts} attempts`);
                this.modalObserver.disconnect();
                this.modalObserver = null;
                this._lastCalculateData = null;
            }
        });
        
        // Start observing document body for changes
        this.modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        
        // Set timeout to clean up observer after 3 seconds
        this.modalObserverTimeout = setTimeout(() => {
            if (this.modalObserver) {
                console.warn('[APIHandler] Modal observer timeout - cleaning up');
                this.modalObserver.disconnect();
                this.modalObserver = null;
                this._lastCalculateData = null;
            }
        }, 3000);
    },
    
    /**
     * Detect clicked item name from modal DOM
     * @returns {string|null}
     */
    detectClickedItem() {
        // Method 1: Modal title (h2) - NEW SELECTOR
        const modalTitle = document.querySelector('h2.text-lg.font-black.text-white');
        if (modalTitle) {
            const textContent = Array.from(modalTitle.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join('');
            
            if (textContent) {
                console.log('[APIHandler] Detected item from modal title:', textContent);
                return textContent;
            }
        }
        
        // Method 2: Image alt attribute in modal
        const modalImages = document.querySelectorAll('img[alt]');
        for (const img of modalImages) {
            const alt = img.getAttribute('alt');
            if (alt && alt !== '' && !alt.includes('icon') && !alt.includes('avatar')) {
                const rect = img.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    console.log('[APIHandler] Detected item from image alt:', alt);
                    return alt;
                }
            }
        }
        
        // Method 3: Extract from image URL
        const modalImageWithSrc = document.querySelector('img[src*="cdn.degendungeon.com"]');
        if (modalImageWithSrc) {
            const src = modalImageWithSrc.getAttribute('src');
            const match = src.match(/\/([^\/]+)\.(png|jpg|webp)/);
            if (match) {
                const itemName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                console.log('[APIHandler] Detected item from image URL:', itemName);
                return itemName;
            }
        }
        
        return null;
    },
    
    // === CLEANUP ===
    
    /**
     * Cleanup and reset the handler
     */
    destroy() {
        this.stopPolling();
        
        if (this.characterObserver) {
            this.characterObserver.disconnect();
            this.characterObserver = null;
        }
        
        if (this.modalObserver) {
            this.modalObserver.disconnect();
            this.modalObserver = null;
        }
        
        if (this.modalObserverTimeout) {
            clearTimeout(this.modalObserverTimeout);
            this.modalObserverTimeout = null;
        }
        
        this.authToken = null;
        this.characterId = null;
        this.characterName = null;
        this.characterList = [];
        this.isInitialized = false;
        
        console.log('[APIHandler] Destroyed');
    }
};

// Expose globally for use in other modules and main script
window.APIHandler = APIHandler;
