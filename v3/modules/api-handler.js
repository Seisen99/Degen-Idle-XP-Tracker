// ====================
// MODULE 5: API HANDLER (Polling-based)
// ====================

// Dependencies: Constants, EfficiencyCalc, ItemDataEngine, State (loaded via @require)

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
        
        // Setup token interception
        this.setupTokenInterceptor();
        
        // Setup DOM observer for modal (preview)
        this.setupModalObserver();
        
        this.isInitialized = true;
        console.log('[APIHandler] Initialization complete, waiting for token...');
    },
    
    // === TOKEN MANAGEMENT ===
    
    /**
     * Setup interceptors to capture auth token from game requests
     */
    setupTokenInterceptor() {
        const self = this;
        
        // Hook fetch to capture Authorization header
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
            
            return self.originalFetch.apply(this, args);
        };
        
        // Hook XMLHttpRequest to capture Authorization header
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        
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
        
        console.log('[APIHandler] Token interceptors installed');
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
            EfficiencyCalc.reset();
            
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
        
        const response = await this.originalFetch(`${this.API_ROOT}${endpoint}`, {
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
        
        // Update efficiency bonuses (must be first for accurate calculations)
        EfficiencyCalc.updateFromAllData(data);
        
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
    
    // === PREVIEW / MODAL OBSERVER ===
    
    /**
     * Setup observer to detect item modal opening
     */
    setupModalObserver() {
        // Cleanup existing
        if (this.modalObserver) {
            this.modalObserver.disconnect();
            this.modalObserver = null;
        }
        
        let debounceTimer = null;
        
        this.modalObserver = new MutationObserver((mutations) => {
            // Debounce to avoid excessive checks
            if (debounceTimer) clearTimeout(debounceTimer);
            
            debounceTimer = setTimeout(() => {
                this.checkForItemModal();
            }, 100);
        });
        
        // Start observing document body
        this.modalObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[APIHandler] Modal observer installed');
    },
    
    /**
     * Check if an item modal is currently open and update preview
     */
    checkForItemModal() {
        const itemName = this.detectClickedItem();
        const skillName = this.detectCurrentSkill();
        
        if (itemName && skillName) {
            console.log(`[APIHandler] Modal detected: ${itemName} (${skillName})`);
            
            const itemData = ItemDataEngine.getItemData(itemName);
            if (itemData) {
                State.updatePreview(itemData);
            }
        }
    },
    
    /**
     * Detect clicked item name from modal DOM
     * @returns {string|null}
     */
    detectClickedItem() {
        // Method 1: Modal title (h2)
        const modalTitle = document.querySelector('h2.text-xl.font-bold.text-white');
        if (modalTitle) {
            const textContent = Array.from(modalTitle.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join('');
            
            if (textContent) {
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
                return itemName;
            }
        }
        
        return null;
    },
    
    /**
     * Detect current skill from modal or page context
     * @returns {string|null}
     */
    detectCurrentSkill() {
        // Method 1: Skill label in modal
        const skillDivs = document.querySelectorAll('div.text-\\[\\#8B8D91\\].text-\\[10px\\]');
        for (const div of skillDivs) {
            const text = div.textContent?.trim()?.toLowerCase();
            if (text && Constants.SKILLS.includes(text)) {
                const parent = div.closest('div.bg-\\[\\#1E2330\\]');
                if (parent) {
                    const rect = parent.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        return text;
                    }
                }
            }
        }
        
        // Method 2: Extract from image URL path
        const modalImageWithSrc = document.querySelector('img[src*="cdn.degendungeon.com"]');
        if (modalImageWithSrc) {
            const src = modalImageWithSrc.getAttribute('src');
            const match = src.match(/\/(Mining|Woodcutting|Tracking|Fishing|Gathering|Herbalism|Forging|Leatherworking|Tailoring|Crafting|Cooking|Alchemy|Woodcrafting)\//i);
            if (match) {
                const skillName = match[1].toLowerCase();
                if (Constants.SKILLS.includes(skillName)) {
                    return skillName;
                }
            }
        }
        
        // Method 3: URL hash
        const urlMatch = window.location.hash.match(/#skill=([^&]+)/);
        if (urlMatch) {
            const skill = urlMatch[1].toLowerCase();
            if (Constants.SKILLS.includes(skill)) {
                return skill;
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
