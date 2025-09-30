class AppDConfigGenerator {
    constructor() {
        this.githubToken = null;
        this.userData = null;
        this.init();
        
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
        
        var loginBtn1 = document.getElementById('github-login');
        if (loginBtn1) {
            loginBtn1.addEventListener('click', function() {
                self.showTokenModal();
            });
        }
        
        var loginBtn2 = document.getElementById('github-login-2');
        if (loginBtn2) {
            loginBtn2.addEventListener('click', function() {
                self.showTokenModal();
            });
        }
        
        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                self.logout();
            });
        }
        
        var configForm = document.getElementById('config-form');
        if (configForm) {
            configForm.addEventListener('submit', function(e) {
                self.handleFormSubmit(e);
            });
            configForm.addEventListener('reset', function() {
                self.resetForm();
            });
        }
        
        var checkboxes = document.querySelectorAll('input[name="config_types"]');
        checkboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                self.handleConfigTypeToggle();
            });
        });
    }

    showTokenModal() {
        var modal = document.createElement('div');
        modal.className = 'token-modal';
        
        var modalContent = document.createElement('div');
        modalContent.className = 'token-modal-content';
        
        var modalHeader = document.createElement('div');
        modalHeader.className = 'token-modal-header';
        modalHeader.innerHTML = '<h3><i class="fab fa-github"></i> GitHub Enterprise Authentication</h3>';
        
        var closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() {
            modal.remove();
        };
        modalHeader.appendChild(closeBtn);
        
        var modalBody = document.createElement('div');
        modalBody.className = 'token-modal-body';
        
        var description = document.createElement('p');
        description.innerHTML = '<strong>To use this application, you need a GitHub Enterprise Personal Access Token.</strong>';
        
        var steps = document.createElement('div');
        steps.className = 'steps';
        steps.innerHTML = '<h4>How to get your Enterprise GitHub token:</h4>' +
            '<ol>' +
            '<li>Go to your <strong>GitHub Enterprise Settings</strong> → <strong>Personal Access Tokens</strong></li>' +
            '<li>Click <strong>"Generate new token (classic)"</strong></li>' +
            '<li>Set <strong>Description</strong>: "AppD Extensions Config Generator"</li>' +
            '<li>Set <strong>Expiration</strong> to your preference (30 days recommended)</li>' +
            '<li>Select <strong>"repo"</strong> scope (Full control of private repositories)</li>' +
            '<li>Click <strong>"Generate token"</strong></li>' +
            '<li>Copy the token and paste it below</li>' +
            '</ol>';
        
        var inputGroup = document.createElement('div');
        inputGroup.className = 'token-input-group';
        
        var label = document.createElement('label');
        label.setAttribute('for', 'github-token');
        label.textContent = 'GitHub Personal Access Token:';
        
        var input = document.createElement('input');
        input.type = 'password';
        input.id = 'github-token';
        input.placeholder = 'ghp_xxxxxxxxxxxxxxxxxxxx';
        
        var help = document.createElement('small');
        help.textContent = 'Your token is stored locally and never sent to any server except GitHub.';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputGroup.appendChild(help);
        
        var actions = document.createElement('div');
        actions.className = 'token-modal-actions';
        
        var loginBtn = document.createElement('button');
        loginBtn.className = 'btn btn-primary';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login with Token';
        
        var self = this;
        loginBtn.onclick = function() {
            self.authenticateWithToken();
        };
        
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = function() {
            modal.remove();
        };
        
        actions.appendChild(loginBtn);
        actions.appendChild(cancelBtn);
        
        modalBody.appendChild(description);
        modalBody.appendChild(steps);
        modalBody.appendChild(inputGroup);
        modalBody.appendChild(actions);
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
        
        var tokenInput = document.getElementById('github-token');
        if (tokenInput) {
            tokenInput.focus();
            
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
            if (loginSection) loginSection.style.display = 'none';
            if (userSection) userSection.style.display = 'flex';
            if (configForm) configForm.style.display = 'block';
            if (loginRequired) loginRequired.style.display = 'none';

            var userAvatar = document.getElementById('user-avatar');
            var userName = document.getElementById('user-name');
            if (userAvatar) userAvatar.src = this.userData.avatar_url;
            if (userName) userName.textContent = this.userData.login;
        } else {
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
                    self.addInitialMonitor(checkbox.value);
                } else {
                    section.style.display = 'none';
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
        var owner = 'kiransailu';
        var repo = 'appd-extensions-config';
        var path = 'configs/' + hostname + '.json';
        var content = btoa(JSON.stringify(config, null, 2));
        var self = this;
        
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
            return null;
        }).then(function(sha) {
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

var processMonitorCount = 0;
var nfsMonitorCount = 0;
var serviceMonitorCount = 0;
var fileMonitorCount = 0;

window.addProcessMonitor = function() {
    var container = document.getElementById('process-monitors-container');
    var index = ++processMonitorCount;
    
    var monitorDiv = document.createElement('div');
    monitorDiv.className = 'monitor-item';
    monitorDiv.id = 'process-monitor-' + index;
    
    var headerDiv = document.createElement('div');
    headerDiv.className = 'monitor-header';
    
    var title = document.createElement('h4');
    title.className = 'monitor-title';
    title.textContent = 'Process Monitor #' + index;
    
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
    removeBtn.onclick = function() {
        window.removeMonitor('process-monitor-' + index);
    };
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(removeBtn);
    
    var fieldsDiv = document.createElement('div');
    fieldsDiv.className = 'monitor-fields';
    
    // Assignment Group
    var assignmentGroup = document.createElement('div');
    assignmentGroup.className = 'field-group';
    assignmentGroup.innerHTML = '<label>Assignment Group</label>' +
        '<input type="text" name="process_' + index + '_assignment_group" placeholder="e.g., CAS, CAST" required>';
    
    // Display Name
    var displayName = document.createElement('div');
    displayName.className = 'field-group';
    displayName.innerHTML = '<label>Display Name</label>' +
        '<input type="text" name="process_' + index + '_displayname" placeholder="e.g., Apache Service Monitor" required>';
    
    // Process Regex
    var processRegex = document.createElement('div');
    processRegex.className = 'field-group field-full-width';
    processRegex.innerHTML = '<label>Process Regex</label>' +
        '<input type="text" name="process_' + index + '_regex" placeholder="e.g., /usr/sbin/httpd -f /usr/local/apache/..." required>';
    
    // Health Rules
    var healthRules = document.createElement('div');
    healthRules.className = 'field-group';
    healthRules.innerHTML = '<label>Health Rules</label>' +
        '<select name="process_' + index + '_health_rules">' +
        '<option value="enabled">Enabled</option>' +
        '<option value="disabled">Disabled</option>' +
        '</select>';
    
    fieldsDiv.appendChild(assignmentGroup);
    fieldsDiv.appendChild(displayName);
    fieldsDiv.appendChild(processRegex);
    fieldsDiv.appendChild(healthRules);
    
    monitorDiv.appendChild(headerDiv);
    monitorDiv.appendChild(fieldsDiv);
    
    container.appendChild(monitorDiv);
};

window.addNFSMonitor = function() {
    var container = document.getElementById('nfs-monitors-container');
    var index = ++nfsMonitorCount;
    
    var monitorDiv = document.createElement('div');
    monitorDiv.className = 'monitor-item';
    monitorDiv.id = 'nfs-monitor-' + index;
    
    var headerDiv = document.createElement('div');
    headerDiv.className = 'monitor-header';
    
    var title = document.createElement('h4');
    title.className = 'monitor-title';
    title.textContent = 'NFS Monitor #' + index;
    
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
    removeBtn.onclick = function() {
        window.removeMonitor('nfs-monitor-' + index);
    };
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(removeBtn);
    
    var fieldsDiv = document.createElement('div');
    fieldsDiv.className = 'monitor-fields';
    
    // NFS Mount Path
    var nfsMount = document.createElement('div');
    nfsMount.className = 'field-group';
    nfsMount.innerHTML = '<label>NFS Mount Path</label>' +
        '<input type="text" name="nfs_' + index + '_nfs_mount" placeholder="e.g., /cebitq/cebitiop" required>';
    
    // Display Name
    var displayName = document.createElement('div');
    displayName.className = 'field-group';
    displayName.innerHTML = '<label>Display Name</label>' +
        '<input type="text" name="nfs_' + index + '_displayname" placeholder="e.g., var Log Monitoring" required>';
    
    // Assignment Group
    var assignmentGroup = document.createElement('div');
    assignmentGroup.className = 'field-group';
    assignmentGroup.innerHTML = '<label>Assignment Group</label>' +
        '<input type="text" name="nfs_' + index + '_assignment_group" placeholder="e.g., CAS, CAST" required>';
    
    // Health Rules
    var healthRules = document.createElement('div');
    healthRules.className = 'field-group';
    healthRules.innerHTML = '<label>Health Rules</label>' +
        '<select name="nfs_' + index + '_health_rules">' +
        '<option value="disabled">Disabled</option>' +
        '<option value="enabled">Enabled</option>' +
        '</select>';
    
    fieldsDiv.appendChild(nfsMount);
    fieldsDiv.appendChild(displayName);
    fieldsDiv.appendChild(assignmentGroup);
    fieldsDiv.appendChild(healthRules);
    
    monitorDiv.appendChild(headerDiv);
    monitorDiv.appendChild(fieldsDiv);
    
    container.appendChild(monitorDiv);
};

window.addServiceMonitor = function() {
    var container = document.getElementById('service-monitors-container');
    var index = ++serviceMonitorCount;
    
    var monitorDiv = document.createElement('div');
    monitorDiv.className = 'monitor-item';
    monitorDiv.id = 'service-monitor-' + index;
    
    var headerDiv = document.createElement('div');
    headerDiv.className = 'monitor-header';
    
    var title = document.createElement('h4');
    title.className = 'monitor-title';
    title.textContent = 'Service Monitor #' + index;
    
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
    removeBtn.onclick = function() {
        window.removeMonitor('service-monitor-' + index);
    };
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(removeBtn);
    
    var fieldsDiv = document.createElement('div');
    fieldsDiv.className = 'monitor-fields';
    
    // Assignment Group
    var assignmentGroup = document.createElement('div');
    assignmentGroup.className = 'field-group';
    assignmentGroup.innerHTML = '<label>Assignment Group</label>' +
        '<input type="text" name="service_' + index + '_assignment_group" placeholder="e.g., CAS, CAST" required>';
    
    // Service Names
    var serviceNames = document.createElement('div');
    serviceNames.className = 'field-group';
    serviceNames.innerHTML = '<label>Service Names (comma-separated)</label>' +
        '<input type="text" name="service_' + index + '_service" placeholder="e.g., XblGameSave, Ifsvc, Dhcp" required>';
    
    fieldsDiv.appendChild(assignmentGroup);
    fieldsDiv.appendChild(serviceNames);
    
    monitorDiv.appendChild(headerDiv);
    monitorDiv.appendChild(fieldsDiv);
    
    container.appendChild(monitorDiv);
};

window.addFileMonitor = function() {
    var container = document.getElementById('file-monitors-container');
    var index = ++fileMonitorCount;
    
    var monitorDiv = document.createElement('div');
    monitorDiv.className = 'monitor-item';
    monitorDiv.id = 'file-monitor-' + index;
    
    var headerDiv = document.createElement('div');
    headerDiv.className = 'monitor-header';
    
    var title = document.createElement('h4');
    title.className = 'monitor-title';
    title.textContent = 'File Monitor #' + index;
    
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
    removeBtn.onclick = function() {
        window.removeMonitor('file-monitor-' + index);
    };
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(removeBtn);
    
    var fieldsDiv = document.createElement('div');
    fieldsDiv.className = 'monitor-fields';
    
    // File Path
    var filePath = document.createElement('div');
    filePath.className = 'field-group';
    filePath.innerHTML = '<label>File Path</label>' +
        '<input type="text" name="file_' + index + '_file_name" placeholder="e.g., /u01/FileGPS/ST_Inbound/logs/ST_INBOUND_CLIENT.log" required>';
    
    // Last Modified Check
    var lastModified = document.createElement('div');
    lastModified.className = 'field-group';
    lastModified.innerHTML = '<label>Last Modified Check (minutes)</label>' +
        '<input type="number" name="file_' + index + '_last_modified" value="15" min="1" required>';
    
    fieldsDiv.appendChild(filePath);
    fieldsDiv.appendChild(lastModified);
    
    monitorDiv.appendChild(headerDiv);
    monitorDiv.appendChild(fieldsDiv);
    
    container.appendChild(monitorDiv);
};

window.removeMonitor = function(monitorId) {
    var monitor = document.getElementById(monitorId);
    if (monitor) {
        monitor.remove();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    new AppDConfigGenerator();
});