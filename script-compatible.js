class AppDConfigGenerator {
    constructor() {
        this.githubToken = null;
        this.userData = null;
        this.init();
        
        // Add reference to instance for modal methods
        var container = document.querySelector('.container');
        if (container) {
            container.classList.add('config-app');
            container.configInstance = this;
        }
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
        this.handleConfigTypeToggle();
    }

    bindEvents() {
        var self = this;
        
        // GitHub login buttons (now shows PAT modal)
        var loginBtn1 = document.getElementById('github-login');
        if (loginBtn1) {
            loginBtn1.addEventListener('click', function() { self.showTokenModal(); });
        }
        
        var loginBtn2 = document.getElementById('github-login-2');
        if (loginBtn2) {
            loginBtn2.addEventListener('click', function() { self.showTokenModal(); });
        }
        
        // Logout button
        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() { self.logout(); });
        }
        
        // Form submission
        var configForm = document.getElementById('config-form');
        if (configForm) {
            configForm.addEventListener('submit', function(e) { self.handleFormSubmit(e); });
            configForm.addEventListener('reset', function() { self.resetForm(); });
        }
        
        // Configuration type checkboxes
        var checkboxes = document.querySelectorAll('input[name="config_types"]');
        checkboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', function() { self.handleConfigTypeToggle(); });
        });
    }

    showTokenModal() {
        var modal = document.createElement('div');
        modal.className = 'token-modal';
        modal.innerHTML = 
            '<div class="token-modal-content">' +
                '<div class="token-modal-header">' +
                    '<h3><i class="fab fa-github"></i> GitHub Enterprise Authentication</h3>' +
                    '<button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>' +
                '</div>' +
                '<div class="token-modal-body">' +
                    '<p><strong>To use this application, you need a GitHub Enterprise Personal Access Token.</strong></p>' +
                    '<div class="steps">' +
                        '<h4>How to get your Enterprise GitHub token:</h4>' +
                        '<ol>' +
                            '<li>Go to your <strong>GitHub Enterprise Settings</strong> → <strong>Personal Access Tokens</strong></li>' +
                            '<li>Click <strong>"Generate new token (classic)"</strong></li>' +
                            '<li>Set <strong>Description</strong>: "AppD Extensions Config Generator"</li>' +
                            '<li>Set <strong>Expiration</strong> to your preference (30 days recommended)</li>' +
                            '<li>Select <strong>"repo"</strong> scope (Full control of private repositories)</li>' +
                            '<li>Click <strong>"Generate token"</strong></li>' +
                            '<li>Copy the token and paste it below</li>' +
                        '</ol>' +
                    '</div>' +
                    '<div class="token-input-group">' +
                        '<label for="github-token">GitHub Personal Access Token:</label>' +
                        '<input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />' +
                        '<small>Your token is stored locally and never sent to any server except GitHub.</small>' +
                    '</div>' +
                    '<div class="token-modal-actions">' +
                        '<button class="btn btn-primary" onclick="document.querySelector(\'.config-app\').configInstance.authenticateWithToken()">' +
                            '<i class="fas fa-sign-in-alt"></i> Login with Token' +
                        '</button>' +
                        '<button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(modal);
        
        var tokenInput = document.getElementById('github-token');
        if (tokenInput) {
            tokenInput.focus();
            
            // Handle Enter key
            var self = this;
            tokenInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    self.authenticateWithToken();
                }
            });
        }
    }

    authenticateWithToken() {
        var tokenInput = document.getElementById('github-token');
        if (!tokenInput) return;
        
        var token = tokenInput.value.trim();
        
        if (!token) {
            alert('Please enter your GitHub Personal Access Token');
            return;
        }
        
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_') && !token.startsWith('ghs_')) {
            alert('Invalid token format. GitHub tokens should start with "ghp_", "github_pat_", or "ghs_"');
            return;
        }
        
        var self = this;
        this.fetchUserData(token).then(function() {
            // Close modal and update UI
            var modal = document.querySelector('.token-modal');
            if (modal) modal.remove();
            self.updateUI();
        }).catch(function(error) {
            alert('Invalid token or insufficient permissions. Please check your token and try again.');
            console.error('Token validation error:', error);
        });
    }

    fetchUserData(token) {
        var self = this;
        return fetch('https://api.github.com/user', {
            headers: { 'Authorization': 'token ' + token }
        }).then(function(response) {
            if (response.ok) {
                return response.json().then(function(userData) {
                    self.userData = userData;
                    self.githubToken = token;
                    // Store token locally
                    localStorage.setItem('github_token', token);
                });
            } else {
                throw new Error('GitHub API error: ' + response.status);
            }
        }).catch(function(error) {
            console.error('Failed to fetch user data:', error);
            throw error;
        });
    }

    checkAuthentication() {
        var token = localStorage.getItem('github_token');
        var self = this;
        if (token) {
            this.fetchUserData(token).then(function() {
                self.updateUI();
            }).catch(function() {
                localStorage.removeItem('github_token');
                self.updateUI();
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
        var loginSection = document.getElementById('login-section');
        var userSection = document.getElementById('user-section');
        var configForm = document.getElementById('config-form');
        var loginRequired = document.getElementById('login-required');

        if (this.userData && this.githubToken) {
            // User is authenticated
            if (loginSection) loginSection.style.display = 'none';
            if (userSection) userSection.style.display = 'flex';
            if (configForm) configForm.style.display = 'block';
            if (loginRequired) loginRequired.style.display = 'none';

            // Update user info
            var userAvatar = document.getElementById('user-avatar');
            var userName = document.getElementById('user-name');
            if (userAvatar) userAvatar.src = this.userData.avatar_url;
            if (userName) userName.textContent = this.userData.login;
        } else {
            // User is not authenticated
            if (loginSection) loginSection.style.display = 'flex';
            if (userSection) userSection.style.display = 'none';
            if (configForm) configForm.style.display = 'none';
            if (loginRequired) loginRequired.style.display = 'block';
        }
    }

    handleConfigTypeToggle() {
        var checkboxes = document.querySelectorAll('input[name="config_types"]');
        var sections = {
            'process_monitor': document.getElementById('process-section'),
            'nfs_monitor': document.getElementById('nfs-section'),
            'service_monitor': document.getElementById('service-section'),
            'monitored_files': document.getElementById('files-section')
        };

        var self = this;
        checkboxes.forEach(function(checkbox) {
            var section = sections[checkbox.value];
            if (section) {
                if (checkbox.checked) {
                    section.style.display = 'block';
                    // Add initial monitor if container is empty
                    self.addInitialMonitor(checkbox.value);
                } else {
                    section.style.display = 'none';
                    // Clear monitors when unchecked
                    self.clearMonitors(checkbox.value);
                }
            }
        });
    }

    addInitialMonitor(type) {
        var containers = {
            'process_monitor': 'process-monitors-container',
            'nfs_monitor': 'nfs-monitors-container',
            'service_monitor': 'service-monitors-container',
            'monitored_files': 'file-monitors-container'
        };
        
        var container = document.getElementById(containers[type]);
        if (container && container.children.length === 0) {
            if (type === 'process_monitor') window.addProcessMonitor();
            else if (type === 'nfs_monitor') window.addNFSMonitor();
            else if (type === 'service_monitor') window.addServiceMonitor();
            else if (type === 'monitored_files') window.addFileMonitor();
        }
    }

    clearMonitors(type) {
        var containers = {
            'process_monitor': 'process-monitors-container',
            'nfs_monitor': 'nfs-monitors-container',
            'service_monitor': 'service-monitors-container',
            'monitored_files': 'file-monitors-container'
        };
        
        var container = document.getElementById(containers[type]);
        if (container) {
            container.innerHTML = '';
        }
    }

    handleFormSubmit(event) {
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

        var self = this;
        try {
            console.log('Collecting form data...');
            var formData = this.collectFormData();
            console.log('Form data collected:', formData);
            
            console.log('Generating JSON config...');
            var jsonConfig = this.generateJSONConfig(formData);
            console.log('JSON config generated:', jsonConfig);
            
            console.log('Creating config file...');
            this.createConfigFile(formData.server_hostname, jsonConfig).then(function() {
                self.showSuccess('Configuration created successfully! File: configs/' + formData.server_hostname + '.json');
                self.resetForm();
            }).catch(function(error) {
                console.error('Form submission error:', error);
                self.showError('Error: ' + error.message);
            }).finally(function() {
                self.showLoading(false);
            });
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError('Error: ' + error.message);
            this.showLoading(false);
        }
    }

    collectFormData() {
        var form = document.getElementById('config-form');
        var formData = new FormData(form);
        
        var data = {
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
        var monitors = [];
        var container = document.getElementById('process-monitors-container');
        var items = container.querySelectorAll('.monitor-item');
        
        items.forEach(function(item) {
            var assignmentGroup = item.querySelector('[name$="assignment_group"]');
            var displayname = item.querySelector('[name$="displayname"]');
            var regex = item.querySelector('[name$="regex"]');
            var healthRules = item.querySelector('[name$="health_rules"]');
            
            var monitor = {
                assignment_group: assignmentGroup ? assignmentGroup.value : '',
                displayname: displayname ? displayname.value : '',
                regex: regex ? regex.value : '',
                health_rules: healthRules ? healthRules.value : 'enabled'
            };
            
            if (monitor.assignment_group && monitor.displayname && monitor.regex) {
                monitors.push(monitor);
            }
        });
        
        return monitors;
    }

    collectNFSMonitors() {
        var monitors = [];
        var container = document.getElementById('nfs-monitors-container');
        var items = container.querySelectorAll('.monitor-item');
        
        items.forEach(function(item) {
            var nfsMount = item.querySelector('[name$="nfs_mount"]');
            var displayname = item.querySelector('[name$="displayname"]');
            var assignmentGroup = item.querySelector('[name$="assignment_group"]');
            var healthRules = item.querySelector('[name$="health_rules"]');
            
            var monitor = {
                nfsMountsToMonitor: nfsMount ? '"' + nfsMount.value + '"' : '',
                displayname: displayname ? displayname.value : '',
                assignment_group: assignmentGroup ? assignmentGroup.value : '',
                health_rules: healthRules ? healthRules.value : 'disabled'
            };
            
            if (monitor.nfsMountsToMonitor && monitor.displayname && monitor.assignment_group) {
                monitors.push(monitor);
            }
        });
        
        return monitors;
    }

    collectServiceMonitors() {
        var monitors = [];
        var container = document.getElementById('service-monitors-container');
        var items = container.querySelectorAll('.monitor-item');
        
        items.forEach(function(item) {
            var assignmentGroup = item.querySelector('[name$="assignment_group"]');
            var service = item.querySelector('[name$="service"]');
            
            var monitor = {
                assignment_group: assignmentGroup ? assignmentGroup.value : '',
                service: service ? service.value : ''
            };
            
            if (monitor.assignment_group && monitor.service) {
                monitors.push(monitor);
            }
        });
        
        return monitors;
    }

    collectFileMonitors() {
        var monitors = [];
        var container = document.getElementById('file-monitors-container');
        var items = container.querySelectorAll('.monitor-item');
        
        items.forEach(function(item) {
            var fileName = item.querySelector('[name$="file_name"]');
            var lastModified = item.querySelector('[name$="last_modified"]');
            
            var monitor = {
                name: fileName ? fileName.value : '',
                last_modified_check: lastModified ? parseInt(lastModified.value) || 30 : 30
            };
            
            if (monitor.name) {
                monitors.push(monitor);
            }
        });
        
        return monitors;
    }

    generateJSONConfig(formData) {
        var config = {};

        // Add configuration details based on selected types
        if (formData.config_types.indexOf('process_monitor') !== -1 && formData.process_monitors.length > 0) {
            config.process_monitor = {
                monitors: formData.process_monitors
            };
        }

        if (formData.config_types.indexOf('nfs_monitor') !== -1 && formData.nfs_monitors.length > 0) {
            config.nfs_monitor = {
                NFS: formData.nfs_monitors
            };
        }

        if (formData.config_types.indexOf('service_monitor') !== -1 && formData.service_monitors.length > 0) {
            config.service_monitor = {
                service: formData.service_monitors
            };
        }

        if (formData.config_types.indexOf('monitored_files') !== -1 && formData.file_monitors.length > 0) {
            config.monitored_files = formData.file_monitors;
        }

        return config;
    }

    createConfigFile(hostname, config) {
        var owner = 'kiransailu'; // Your GitHub username
        var repo = 'appd-extensions-config';
        var path = 'configs/' + hostname + '.json';
        var content = btoa(JSON.stringify(config, null, 2));

        var self = this;
        
        // Check if file exists first
        return fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path, {
            headers: { 'Authorization': 'token ' + this.githubToken }
        }).then(function(existingResponse) {
            var sha = null;
            if (existingResponse.ok) {
                return existingResponse.json().then(function(fileData) {
                    sha = fileData.sha;
                    return sha;
                });
            }
            return null;
        }).catch(function() {
            // File doesn't exist, which is fine
            return null;
        }).then(function(sha) {
            // Create or update file
            console.log('Creating file at: https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path);
            
            var requestBody = {
                message: (sha ? 'Update' : 'Add') + ' configuration for ' + hostname,
                content: content
            };
            
            if (sha) {
                requestBody.sha = sha;
            }
            
            console.log('Request body:', requestBody);
            
            return fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path, {
                method: 'PUT',
                headers: {
                    'Authorization': 'token ' + self.githubToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
        }).then(function(response) {
            console.log('GitHub API response status:', response.status);
            
            if (!response.ok) {
                return response.text().then(function(errorText) {
                    console.error('GitHub API error response:', errorText);
                    
                    var errorMessage = 'Failed to create configuration file.';
                    
                    if (response.status === 404) {
                        errorMessage = 'Repository not found or access denied. Check your token permissions.';
                    } else if (response.status === 403) {
                        errorMessage = 'Permission denied. Your token might not have "repo" scope.';
                    } else if (response.status === 401) {
                        errorMessage = 'Invalid token. Please check your GitHub token.';
                    }
                    
                    try {
                        var error = JSON.parse(errorText);
                        errorMessage = error.message || errorMessage;
                    } catch (e) {
                        // Use default error message
                    }
                    
                    throw new Error(errorMessage);
                });
            }

            return response.json().then(function(result) {
                console.log('File created successfully:', result);
                return result;
            });
        });
    }

    resetForm() {
        var form = document.getElementById('config-form');
        if (form) form.reset();
        
        // Clear all dynamic monitors
        var containers = [
            'process-monitors-container',
            'nfs-monitors-container', 
            'service-monitors-container',
            'file-monitors-container'
        ];
        
        containers.forEach(function(containerId) {
            var container = document.getElementById(containerId);
            if (container) container.innerHTML = '';
        });
        
        this.handleConfigTypeToggle();
    }

    showLoading(show) {
        var loading = document.getElementById('loading');
        var form = document.getElementById('config-form');
        
        if (loading) loading.style.display = show ? 'block' : 'none';
        if (form) {
            form.style.opacity = show ? '0.5' : '1';
            form.style.pointerEvents = show ? 'none' : 'auto';
        }
    }

    showSuccess(message) {
        var successElement = document.getElementById('success-message');
        if (successElement) {
            var span = successElement.querySelector('span');
            if (span) span.textContent = message;
            successElement.style.display = 'flex';
            setTimeout(function() {
                successElement.style.display = 'none';
            }, 5000);
        }
    }

    showError(message) {
        var errorElement = document.getElementById('error-message');
        if (errorElement) {
            var errorText = document.getElementById('error-text');
            if (errorText) errorText.textContent = message;
            errorElement.style.display = 'flex';
            setTimeout(function() {
                errorElement.style.display = 'none';
            }, 8000);
        }
    }

    hideMessages() {
        var successElement = document.getElementById('success-message');
        var errorElement = document.getElementById('error-message');
        
        if (successElement) successElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
    }
}

// Global functions for dynamic monitor management
var processMonitorCount = 0;
var nfsMonitorCount = 0;
var serviceMonitorCount = 0;
var fileMonitorCount = 0;

window.addProcessMonitor = function() {
    var container = document.getElementById('process-monitors-container');
    var index = ++processMonitorCount;
    
    var monitorHTML = 
        '<div class="monitor-item" id="process-monitor-' + index + '">' +
            '<div class="monitor-header">' +
                '<h4 class="monitor-title">Process Monitor #' + index + '</h4>' +
                '<button type="button" class="btn-remove" onclick="removeMonitor(\'process-monitor-' + index + '\')">' +
                    '<i class="fas fa-trash"></i> Remove' +
                '</button>' +
            '</div>' +
            '<div class="monitor-fields">' +
                '<div class="field-group">' +
                    '<label>Assignment Group</label>' +
                    '<input type="text" name="process_' + index + '_assignment_group" placeholder="e.g., CAS, CAST" required>' +
                '</div>' +
                '<div class="field-group">' +
                    '<label>Display Name</label>' +
                    '<input type="text" name="process_' + index + '_displayname" placeholder="e.g., Apache Service Monitor" required>' +
                '</div>' +
                '<div class="field-group field-full-width">' +
                    '<label>Process Regex</label>' +
                    '<input type="text" name="process_' + index + '_regex" placeholder="e.g., /usr/sbin/httpd -f /usr/local/apache/..." required>' +
                '</div>' +
                '<div class="field-group">' +
                    '<label>Health Rules</label>' +
                    '<select name="process_' + index + '_health_rules">' +
                        '<option value="enabled">Enabled</option>' +
                        '<option value="disabled">Disabled</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
};

window.addNFSMonitor = function() {
    var container = document.getElementById('nfs-monitors-container');
    var index = ++nfsMonitorCount;
    
    var monitorHTML = 
        '<div class="monitor-item" id="nfs-monitor-' + index + '">' +
            '<div class="monitor-header">' +
                '<h4 class="monitor-title">NFS Monitor #' + index + '</h4>' +
                '<button type="button" class="btn-remove" onclick="removeMonitor(\'nfs-monitor-' + index + '\')">' +
                    '<i class="fas fa-trash"></i> Remove' +
                '</button>' +
            '</div>' +
            '<div class="monitor-fields">' +
                '<div class="field-group">' +
                    '<label>NFS Mount Path</label>' +
                    '<input type="text" name="nfs_' + index + '_nfs_mount" placeholder="e.g., /cebitq/cebitiop" required>' +
                '</div>' +
                '<div class="field-group">' +
                    '<label>Display Name</label>' +
                    '<input type="text" name="nfs_' + index + '_displayname" placeholder="e.g., var Log Monitoring" required>' +
                '</div>' +
                '<div class="field-group">' +
                    '<label>Assignment Group</label>' +
                    '<input type="text" name="nfs_' + index + '_assignment_group" placeholder="e.g., CAS, CAST" required>' +
                '</div>' +
                '<div class="field-group">' +
                    '<label>Health Rules</label>' +
                    '<select name="nfs_' + index + '_health_rules">' +
                        '<option value="disabled">Disabled</option>' +
                        '<option value="enabled">Enabled</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
};

window.addServiceMonitor = function() {
    var container = document.getElementById('service-monitors-container');
    var index = ++serviceMonitorCount;
    
    var monitorHTML = 
        '<div class="monitor-item" id="service-monitor-' + index + '">' +
            '<div class="monitor-header">' +
                '<h4 class="monitor-title">Service Monitor #' + index + '</h4>' +
                '<button type="button" class="btn-remove" onclick="removeMonitor(\'service-monitor-' + index + '\')">' +
                    '<i class="fas fa-trash"></i> Remove' +
                '</button>' +
            '</div>' +
            '<div class="monitor-fields">' +
                '<div class="field-group">' +
                    '<label>Assignment Group</label>' +
                    '<input type="text" name="service_' + index + '_assignment_group" placeholder="e.g., CAS, CAST" required>' +
                '</div>' +
                '<div class="field-group">' +
                    '<label>Service Names (comma-separated)</label>' +
                    '<input type="text" name="service_' + index + '_service" placeholder="e.g., XblGameSave, Ifsvc, Dhcp" required>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
};

window.addFileMonitor = function() {
    var container = document.getElementById('file-monitors-container');
    var index = ++fileMonitorCount;
    
    var monitorHTML = 
        '<div class="monitor-item" id="file-monitor-' + index + '">' +
            '<div class="monitor-header">' +
                '<h4 class="monitor-title">File Monitor #' + index + '</h4>' +
                '<button type="button" class="btn-remove" onclick="removeMonitor(\'file-monitor-' + index + '\')">' +
                    '<i class="fas fa-trash"></i> Remove' +
                '</button>' +
            '</div>' +
            '<div class="monitor-fields">' +
                '<div class="field-group">' +
                    '<label>File Path</label>' +
                    '<input type="text" name="file_' + index + '_file_name" placeholder="e.g., /u01/FileGPS/ST_Inbound/logs/ST_INBOUND_CLIENT.log" required>' +
                '</div>' +
                '<div class="field-group">' +
                    '<label>Last Modified Check (minutes)</label>' +
                    '<input type="number" name="file_' + index + '_last_modified" value="15" min="1" required>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    container.insertAdjacentHTML('beforeend', monitorHTML);
};

window.removeMonitor = function(monitorId) {
    var monitor = document.getElementById(monitorId);
    if (monitor) {
        monitor.remove();
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    new AppDConfigGenerator();
});