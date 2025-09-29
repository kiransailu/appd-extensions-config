class AppDConfigGenerator {
    constructor() {
        this.githubToken = null;
        this.userData = null;
        this.init();
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
        const clientId = 'your_github_app_client_id'; // Replace with your GitHub App Client ID
        const redirectUri = window.location.origin;
        const scope = 'repo';
        
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        window.location.href = authUrl;
    }

    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            try {
                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Exchange code for token (this would typically go through your backend)
                const token = await this.exchangeCodeForToken(code);
                
                if (token) {
                    localStorage.setItem('github_token', token);
                    await this.fetchUserData(token);
                    this.updateUI();
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                this.showError('Authentication failed. Please try again.');
            }
        }
    }

    async exchangeCodeForToken(code) {
        // In a production environment, this should go through your backend
        // For demonstration, we'll simulate token exchange
        // You need to implement a backend endpoint to handle this securely
        
        try {
            // This is a placeholder - implement your backend token exchange
            const response = await fetch('/api/auth/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.access_token;
            }
        } catch (error) {
            console.error('Token exchange error:', error);
        }
        
        // For demo purposes - in production, remove this and implement proper backend
        return prompt('Please enter your GitHub Personal Access Token:');
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
            'monitored_files': document.getElementById('files-section')
        };

        checkboxes.forEach(checkbox => {
            const section = sections[checkbox.value];
            if (section) {
                section.style.display = checkbox.checked ? 'block' : 'none';
            }
        });
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (!this.githubToken) {
            this.showError('Please login with GitHub first.');
            return;
        }

        this.showLoading(true);
        this.hideMessages();

        try {
            const formData = this.collectFormData();
            const jsonConfig = this.generateJSONConfig(formData);
            
            await this.createConfigFile(formData.server_hostname, jsonConfig);
            this.showSuccess('Configuration created successfully!');
            this.resetForm();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(error.message || 'Failed to create configuration. Please try again.');
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
            process_monitors: formData.get('process_monitors') || '',
            nfs_config: formData.get('nfs_config') || '',
            file_monitoring: formData.get('file_monitoring') || ''
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

    generateJSONConfig(formData) {
        const config = {
            server_hostname: formData.server_hostname,
            config_types: formData.config_types,
            created_at: new Date().toISOString(),
            created_by: this.userData.login
        };

        // Add configuration details based on selected types
        if (formData.config_types.includes('process_monitor') && formData.process_monitors) {
            try {
                config.process_monitors = JSON.parse(formData.process_monitors);
            } catch (error) {
                throw new Error('Invalid JSON format in Process Monitors Configuration.');
            }
        }

        if (formData.config_types.includes('nfs_monitor') && formData.nfs_config) {
            try {
                config.nfs_config = JSON.parse(formData.nfs_config);
            } catch (error) {
                throw new Error('Invalid JSON format in NFS Monitoring Configuration.');
            }
        }

        if (formData.config_types.includes('monitored_files') && formData.file_monitoring) {
            try {
                config.file_monitoring = JSON.parse(formData.file_monitoring);
            } catch (error) {
                throw new Error('Invalid JSON format in File Monitoring Configuration.');
            }
        }

        return config;
    }

    async createConfigFile(hostname, config) {
        const owner = 'your-username'; // Replace with your GitHub username
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
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `${sha ? 'Update' : 'Add'} configuration for ${hostname}`,
                    content: content,
                    sha: sha
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create configuration file.');
            }

            return await response.json();
        } catch (error) {
            console.error('GitHub API error:', error);
            throw error;
        }
    }

    resetForm() {
        document.getElementById('config-form').reset();
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AppDConfigGenerator();
});