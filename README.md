# AppDynamics Extensions Config Generator

A GitHub Pages website for generating AppDynamics extensions server configurations with form-based input and automatic JSON file creation.

## Features

- 🔐 GitHub OAuth authentication
- 📝 Interactive form for server configuration
- 🎯 Dynamic form sections based on selected monitoring types
- 📄 Automatic JSON file generation in `/configs/` directory
- 🎨 Modern, responsive design
- ⚡ Real-time form validation

## Setup Instructions

### 1. Repository Setup

1. Create a new repository named `appd-extensions-config`
2. Upload all files to the repository
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" and choose `main` branch
5. Select `/ (root)` as the folder
6. Click Save

### 2. GitHub App Configuration

For authentication to work, you need to create a GitHub App:

1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Fill in the required fields:
   - **GitHub App name**: `AppD Extensions Config Generator`
   - **Homepage URL**: `https://your-username.github.io/appd-extensions-config`
   - **Authorization callback URL**: `https://your-username.github.io/appd-extensions-config`
4. Under "Repository permissions":
   - **Contents**: Read & write
   - **Metadata**: Read
5. Save and note the **Client ID**
6. Generate a **Client Secret**

### 3. Update Configuration

Update the following files with your information:

#### `script.js`
```javascript
// Line 32: Replace with your GitHub App Client ID
const clientId = 'your_github_app_client_id';

// Line 120: Replace with your GitHub username
const owner = 'your-username';
```

#### `_config.yml`
```yaml
url: "https://your-username.github.io"
github_username: your-username
author: Your Name
```

#### `index.html`
```html
<!-- Line 134: Update GitHub repository link -->
<a href="https://github.com/your-username/appd-extensions-config" target="_blank">
```

### 4. Backend API (Optional but Recommended)

For production use, implement a backend endpoint to handle OAuth token exchange securely:

```javascript
// POST /api/auth/github
{
  "code": "github_oauth_code"
}
```

Returns:
```javascript
{
  "access_token": "github_access_token"
}
```

## Usage

1. Visit your GitHub Pages URL
2. Click "Login with GitHub"
3. Authorize the application
4. Fill out the configuration form:
   - Enter server hostname (FQDN)
   - Select monitoring types needed
   - Configure specific monitoring components
5. Click "Generate Configuration"
6. JSON file will be automatically created in `/configs/{hostname}.json`

## Configuration Types

### Process Monitor
Monitor specific processes on the server.
```json
[
  {
    "assignment_group": "PROD",
    "displayname": "My Custom Process",
    "regex": "java.*app"
  }
]
```

### NFS Monitor
Monitor NFS mount points.
```json
[
  {
    "mount_path": "/nfs/shared",
    "check_availability": true
  }
]
```

### File Monitoring
Monitor specific files for changes.
```json
[
  {
    "name": "/opt/app/logs/app.log",
    "last_modified_check": 30
  }
]
```

## Generated JSON Structure

The generated configuration files follow this structure:

```json
{
  "server_hostname": "server01.domain.com",
  "config_types": ["process_monitor", "monitored_files"],
  "created_at": "2024-01-15T10:30:00.000Z",
  "created_by": "github_username",
  "process_monitors": [
    {
      "assignment_group": "PROD",
      "displayname": "Java Application",
      "regex": "java.*myapp"
    }
  ],
  "file_monitoring": [
    {
      "name": "/opt/app/logs/app.log",
      "last_modified_check": 30
    }
  ]
}
```

## File Structure

```
appd-extensions-config/
├── index.html              # Main form interface
├── styles.css              # Styling and responsive design
├── script.js               # Form logic and GitHub API integration
├── _config.yml             # Jekyll configuration
├── README.md               # Documentation
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages deployment
└── configs/                # Generated configuration files
    ├── server01.domain.com.json
    ├── server02.domain.com.json
    └── ...
```

## Development

To test locally:

1. Install Jekyll: `gem install jekyll bundler`
2. Run: `bundle exec jekyll serve`
3. Open: `http://localhost:4000`

## Security Notes

- Never commit Client Secrets to the repository
- Use environment variables for sensitive data in production
- Implement proper token validation on the backend
- Consider rate limiting for form submissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details