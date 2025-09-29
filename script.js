class AppDConfigGenerator {
    constructor() {
        this.githubToken = null;
        this.userData = null;
        this.init();
        
        // Add reference to instance for modal methods
        document.querySelector('.container').classList.add('config-app');
        document.querySelector('.config-app').configInstance = this;
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
        this.handleConfigTypeToggle();
    }

    bindEvents() {
        // GitHub login buttons
        document.getElementById('github-login')?.addEventListener('click', () => this.initiateGitHubLogin());
        document.getElementById('github-login-2')?.addEventListener('click', () => this.initiateGitHubLogin());
        
        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        
        // Form submission
        document.getElementById('config-form')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Form reset
        document.getElementById('config-form')?.addEventListener('reset', () => this.resetForm());
        
        // Configuration type checkboxes
        document.querySelectorAll('input[name="config_types"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleConfigTypeToggle());
        });

        // Handle OAuth callback
        this.handleOAuthCallback();
    }

    initiateGitHubLogin() {
        this.showTokenModal();
    }

    showTokenModal() {
        const modal = document.createElement('div');
        modal.className = 'token-modal';
        modal.innerHTML = `
            <div class="token-modal-content">
                <div class="token-modal-header">
                    <h3><i class="fab fa-github"></i> GitHub Authentication</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="token-modal-body">
                    <p><strong>To use this application, you need a GitHub Personal Access Token.</strong></p>
                    
                    <div class="steps">
                        <h4>How to get your token:</h4>
                        <ol>
                            <li>Go to <a href="https://github.com/settings/tokens/new?scopes=repo&description=AppD Extensions Config Generator" target="_blank">GitHub Token Settings</a></li>
                            <li>Set <strong>Expiration</strong> to your preference (30 days recommended)</li>
                            <li>Ensure <strong>"repo"</strong> scope is selected</li>
                            <li>Click <strong>"Generate token"</strong></li>
                            <li>Copy the token and paste it below</li>
                        </ol>
                    </div>
                    
                    <div class="token-input-group">
                        <label for="github-token">GitHub Personal Access Token:</label>
                        <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
                        <small>Your token is stored locally and never sent to any server except GitHub.</small>
                    </div>
                    
                    <div class="token-modal-actions">
                        <button class="btn btn-primary" onclick="document.querySelector('.config-app').configInstance.authenticateWithToken()">
                            <i class="fas fa-sign-in-alt"></i> Login with Token
                        </button>
                        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.getElementById('github-token').focus();
        
        // Handle Enter key
        document.getElementById('github-token').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.authenticateWithToken();
            }
        });
    }

    async authenticateWithToken() {
        const tokenInput = document.getElementById('github-token');
        const token = tokenInput.value.trim();
        
        if (!token) {
            alert('Please enter your GitHub Personal Access Token');
            return;
        }
        
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            alert('Invalid token format. GitHub tokens should start with "ghp_" or "github_pat_"');
            return;
        }
        
        try {
            // Test the token by fetching user data
            await this.fetchUserData(token);
            
            // Close modal and update UI
            document.querySelector('.token-modal').remove();
            this.updateUI();
            
        } catch (error) {
            alert('Invalid token or insufficient permissions. Please check your token and try again.');
            console.error('Token validation error:', error);
        }
    }

    async handleOAuthCallback() {
        // No longer needed - we're using Personal Access Tokens
        // Clear any OAuth parameters from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('code')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async fetchUserData(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${token}` }
            });
            
            if (response.ok) {
                this.userData = await response.json();
                this.githubToken = token;
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            throw error;
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('github_token');
        if (token) {
            this.fetchUserData(token).then(() => {
                this.updateUI();
            }).catch(() => {
                localStorage.removeItem('github_token');
                this.updateUI();
            });
        } else {
            this.updateUI();
        }
    }

    logout() {
        localStorage.removeItem('github_token');
        this.githubToken = null;
        this.userData = null;
        this.updateUI();
    }

    updateUI() {
        const loginSection = document.getElementById('login-section');
        const userSection = document.getElementById('user-section');
        const configForm = document.getElementById('config-form');
        const loginRequired = document.getElementById('login-required');

        if (this.userData && this.githubToken) {
            // User is authenticated
            loginSection.style.display = 'none';
            userSection.style.display = 'flex';
            configForm.style.display = 'block';
            loginRequired.style.display = 'none';

            // Update user info
            document.getElementById('user-avatar').src = this.userData.avatar_url;
            document.getElementById('user-name').textContent = this.userData.login;
        } else {
            // User is not authenticated
            loginSection.style.display = 'flex';
            userSection.style.display = 'none';
            configForm.style.display = 'none';
            loginRequired.style.display = 'block';
        }
    }

    handleConfigTypeToggle() {
        const checkboxes = document.querySelectorAll('input[name="config_types"]');
        const sections = {
            'process_monitor': document.getElementById('process-section'),
            'nfs_monitor': document.getElementById('nfs-section'),
            'service_monitor': document.getElementById('service-section'),
            'monitored_files': document.getElementById('files-section')
        };

        checkboxes.forEach(checkbox => {
            const section = sections[checkbox.value];
            if (section) {
                if (checkbox.checked) {
                    section.style.display = 'block';
                    // Add initial monitor if container is empty
                    this.addInitialMonitor(checkbox.value);
                } else {
                    section.style.display = 'none';
                    // Clear monitors when unchecked
                    this.clearMonitors(checkbox.value);
                }
            }
        });
    }

    addInitialMonitor(type) {
        const containers = {
            'process_monitor': 'process-monitors-container',
            'nfs_monitor': 'nfs-monitors-container',
            'service_monitor': 'service-monitors-container',
            'monitored_files': 'file-monitors-container'
        };
        
        const container = document.getElementById(containers[type]);
        if (container && container.children.length === 0) {
            if (type === 'process_monitor') window.addProcessMonitor();
            else if (type === 'nfs_monitor') window.addNFSMonitor();
            else if (type === 'service_monitor') window.addServiceMonitor();
            else if (type === 'monitored_files') window.addFileMonitor();
        }
    }

    clearMonitors(type) {
        const containers = {
            'process_monitor': 'process-monitors-container',
            'nfs_monitor': 'nfs-monitors-container',
            'service_monitor': 'service-monitors-container',
            'monitored_files': 'file-monitors-container'
        };
        
        const container = document.getElementById(containers[type]);
        if (container) {
            container.innerHTML = '';
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        console.log('Form submission started...');
        
        if (!this.githubToken) {
            this.showError('Please login with GitHub first.');
            return;
        }

        if (!this.userData) {
            this.showError('User data not loaded. Please refresh and try again.');
            return;
        }

        this.showLoading(true);
        this.hideMessages();

        try {
            console.log('Collecting form data...');
            const formData = this.collectFormData();
            console.log('Form data collected:', formData);
            
            console.log('Generating JSON config...');
            const jsonConfig = this.generateJSONConfig(formData);
            console.log('JSON config generated:', jsonConfig);
            
            console.log('Creating config file...');
            await this.createConfigFile(formData.server_hostname, jsonConfig);
            
            this.showSuccess(`Configuration created successfully! File: configs/${formData.server_hostname}.json`);
            this.resetForm();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(`Error: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    collectFormData() {
        const form = document.getElementById('config-form');
        const formData = new FormData(form);
        
        const data = {
            server_hostname: formData.get('server_hostname'),
            config_types: formData.getAll('config_types'),
            process_monitors: this.collectProcessMonitors(),
            nfs_monitors: this.collectNFSMonitors(),
            service_monitors: this.collectServiceMonitors(),
            file_monitors: this.collectFileMonitors()
        };

        // Validation
        if (!data.server_hostname) {
            throw new Error('Server hostname is required.');
        }
        
        if (data.config_types.length === 0) {
            throw new Error('Please select at least one configuration type.');
        }

        return data;
    }

    collectProcessMonitors() {
        const monitors = [];
        const container = document.getElementById('process-monitors-container');
        const items = container.querySelectorAll('.monitor-item');
        
        items.forEach(item => {
            const monitor = {
                assignment_group: item.querySelector('[name$="assignment_group"]').value,
                displayname: item.querySelector('[name$="displayname"]').value,
                regex: item.querySelector('[name$="regex"]').value,
                health_rules: item.querySelector('[name$="health_rules"]').value
            };
            if (monitor.assignment_group && monitor.displayname && monitor.regex) {
                monitors.push(monitor);
            }
        });
        
        return monitors;
    }

    collectNFSMonitors() {
        const monitors = [];
        const container = document.getElementById('nfs-monitors-container');
        const items = container.querySelectorAll('.monitor-item');
        
        items.forEach(item => {
            const monitor = {
                nfsMountsToMonitor: `"${item.querySelector('[name$="nfs_mount"]').value}"`,
                displayname: item.querySelector('[name$="displayname"]').value,
                assignment_group: item.querySelector('[name$="assignment_group"]').value,
                health_rules: item.querySelector('[name$="health_rules"]').value
            };
            if (monitor.nfsMountsToMonitor && monitor.displayname && monitor.assignment_group) {
                monitors.push(monitor);
            }
        });
        
        return monitors;
    }

    collectServiceMonitors() {
        const monitors = [];
        const container = document.getElementById('service-monitors-container');
        const items = container.querySelectorAll('.monitor-item');
        
        items.forEach(item => {
            const service = item.querySelector('[name$="service"]').value;
            if (service) {
                monitors.push({ service: service });
            }
        });
        
        return monitors;
    }

    collectFileMonitors() {
        const monitors = [];
        const container = document.getElementById('file-monitors-container');
        const items = container.querySelectorAll('.monitor-item');
        
        items.forEach(item => {
            const monitor = {
                name: item.querySelector('[name$="file_name"]').value,
                last_modified_check: parseInt(item.querySelector('[name$="last_modified"]').value) || 30
            };
            if (monitor.name) {
                monitors.push(monitor);
            }
        });
        
        return monitors;
    }

    generateJSONConfig(formData) {
        const config = {};

        // Add configuration details based on selected types
        if (formData.config_types.includes('process_monitor') && formData.process_monitors.length > 0) {
            config.process_monitor = {
                monitors: formData.process_monitors
            };
        }

        if (formData.config_types.includes('nfs_monitor') && formData.nfs_monitors.length > 0) {
            config.nfs_monitor = {
                NFS: formData.nfs_monitors
            };
        }

        if (formData.config_types.includes('service_monitor') && formData.service_monitors.length > 0) {
            config.service_monitor = {
                service: formData.service_monitors
            };
        }

        if (formData.config_types.includes('monitored_files') && formData.file_monitors.length > 0) {
            config.monitored_files = formData.file_monitors;
        }

        return config;
    }

    async createConfigFile(hostname, config) {
        const owner = 'kiransailu'; // Replace with your GitHub username
        const repo = 'appd-extensions-config';
        const path = `configs/${hostname}.json`;
        const content = btoa(JSON.stringify(config, null, 2));

        try {
            // Check if file exists
            let sha = null;
            try {
                const existingFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                    headers: { 'Authorization': `token ${this.githubToken}` }
                });
                
                if (existingFile.ok) {
                    const fileData = await existingFile.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                // File doesn't exist, which is fine
            }

            // Create or update file
            console.log(`Creating file at: https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
            
            const requestBody = {
                message: `${sha ? 'Update' : 'Add'} configuration for ${hostname}`,
                content: content,
                ...(sha && { sha: sha })
            };
            
            console.log('Request body:', requestBody);
            
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('GitHub API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('GitHub API error response:', errorText);
                
                let errorMessage = 'Failed to create configuration file.';
                
                if (response.status === 404) {
                    errorMessage = 'Repository not found or access denied. Check your token permissions.';
                } else if (response.status === 403) {
                    errorMessage = 'Permission denied. Your token might not have "repo" scope.';
                } else if (response.status === 401) {
                    errorMessage = 'Invalid token. Please check your GitHub token.';
                }
                
                try {
                    const error = JSON.parse(errorText);
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    // Use default error message
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('File created successfully:', result);
            return result;
        } catch (error) {
            console.error('GitHub API error:', error);
            throw error;
        }
    }

    resetForm() {
        document.getElementById('config-form').reset();
        // Clear all dynamic monitors
        document.getElementById('process-monitors-container').innerHTML = '';
        document.getElementById('nfs-monitors-container').innerHTML = '';
        document.getElementById('service-monitors-container').innerHTML = '';
        document.getElementById('file-monitors-container').innerHTML = '';
        this.handleConfigTypeToggle();
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('config-form').style.opacity = show ? '0.5' : '1';
        document.getElementById('config-form').style.pointerEvents = show ? 'none' : 'auto';
    }

    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        successElement.querySelector('span').textContent = message;
        successElement.style.display = 'flex';
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        document.getElementById('error-text').textContent = message;
        errorElement.style.display = 'flex';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 8000);
    }

    hideMessages() {
        document.getElementById('success-message').style.display = 'none';
        document.getElementById('error-message').style.display = 'none';
    }
}

// Global functions for dynamic monitor management
let processMonitorCount = 0;
let nfsMonitorCount = 0;
let serviceMonitorCount = 0;
let fileMonitorCount = 0;

window.addProcessMonitor = function() {
    const container = document.getElementById('process-monitors-container');
    const index = ++processMonitorCount;
    
    const monitorHTML = `
        <div class="monitor-item" id="process-monitor-${index}">
            <div class="monitor-header">
                <h4 class="monitor-title">Process Monitor #${index}</h4>
                <button type="button" class="btn-remove" onclick="removeMonitor('process-monitor-${index}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="monitor-fields">
                <div class="field-group">
                    <label>Assignment Group</label>
                    <input type="text" name="process_${index}_assignment_group" placeholder="e.g., CAS, CAST" required>
                </div>
                <div class="field-group">
                    <label>Display Name</label>
                    <input type="text" name="process_${index}_displayname" placeholder="e.g., Apache Service Monitor" required>
                </div>
                <div class="field-group field-full-width">
                    <label>Process Regex</label>
                    <input type="text" name="process_${index}_regex" placeholder="e.g., /usr/sbin/httpd -f /usr/local/apache/..." required>
                </div>
                <div class="field-group">
                    <label>Health Rules</label>
                    <select name="process_${index}_health_rules">
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
}

function addNFSMonitor() {
    const container = document.getElementById('nfs-monitors-container');
    const index = ++nfsMonitorCount;
    
    const monitorHTML = `
        <div class="monitor-item" id="nfs-monitor-${index}">
            <div class="monitor-header">
                <h4 class="monitor-title">NFS Monitor #${index}</h4>
                <button type="button" class="btn-remove" onclick="removeMonitor('nfs-monitor-${index}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="monitor-fields">
                <div class="field-group">
                    <label>NFS Mount Path</label>
                    <input type="text" name="nfs_${index}_nfs_mount" placeholder="e.g., /cebitq/cebitiop" required>
                </div>
                <div class="field-group">
                    <label>Display Name</label>
                    <input type="text" name="nfs_${index}_displayname" placeholder="e.g., var Log Monitoring" required>
                </div>
                <div class="field-group">
                    <label>Assignment Group</label>
                    <input type="text" name="nfs_${index}_assignment_group" placeholder="e.g., CAS, CAST" required>
                </div>
                <div class="field-group">
                    <label>Health Rules</label>
                    <select name="nfs_${index}_health_rules">
                        <option value="disabled">Disabled</option>
                        <option value="enabled">Enabled</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
}

function addServiceMonitor() {
    const container = document.getElementById('service-monitors-container');
    const index = ++serviceMonitorCount;
    
    const monitorHTML = `
        <div class="monitor-item" id="service-monitor-${index}">
            <div class="monitor-header">
                <h4 class="monitor-title">Service Monitor #${index}</h4>
                <button type="button" class="btn-remove" onclick="removeMonitor('service-monitor-${index}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="monitor-fields full-width">
                <div class="field-group">
                    <label>Service Names (comma-separated)</label>
                    <input type="text" name="service_${index}_service" placeholder="e.g., XblGameSave, Ifsvc, Dhcp" required>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
}

function addFileMonitor() {
    const container = document.getElementById('file-monitors-container');
    const index = ++fileMonitorCount;
    
    const monitorHTML = `
        <div class="monitor-item" id="file-monitor-${index}">
            <div class="monitor-header">
                <h4 class="monitor-title">File Monitor #${index}</h4>
                <button type="button" class="btn-remove" onclick="removeMonitor('file-monitor-${index}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="monitor-fields">
                <div class="field-group">
                    <label>File Path</label>
                    <input type="text" name="file_${index}_file_name" placeholder="e.g., /u01/FileGPS/ST_Inbound/logs/ST_INBOUND_CLIENT.log" required>
                </div>
                <div class="field-group">
                    <label>Last Modified Check (minutes)</label>
                    <input type="number" name="file_${index}_last_modified" value="15" min="1" required>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
}

function removeMonitor(monitorId) {
    const monitor = document.getElementById(monitorId);
    if (monitor) {
        monitor.remove();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AppDConfigGenerator();
});