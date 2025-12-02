# 🚀 clasp-init

Streamline your Google Apps Script development workflow with automated setup and Git synchronization.

## ✨ Features

- 🔧 **One-command setup** - Initialize new Apps Script projects instantly
- 🔄 **Auto-sync** - Automatically push to Apps Script before Git push
- 🔒 **Secure** - Keep your script IDs out of version control
- 🎯 **Consistent** - Same setup across all your projects
- ⚡ **Fast** - Skip repetitive manual configuration

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) installed
- [clasp](https://github.com/google/clasp) installed: `npm install -g @google/clasp`
- clasp authenticated: `clasp login`
- [Git](https://git-scm.com/) installed

## 📥 Installation

Choose your platform and follow the instructions:

<details>
<summary><b>macOS/Linux (Bash)</b></summary>

1. Open your `.bashrc` or `.bash_profile` file:
   ```bash
   nano ~/.bashrc
   # or
   nano ~/.bash_profile
   ```

2. Add the following function at the end of the file:
   ```bash
   # Function to initialize a new Apps Script project with clasp
   clasp-init() {
     if [ -z "$1" ]; then
       echo "Error: Please provide a script ID"
       echo "Usage: clasp-init <script-id>"
       return 1
     fi
     
     local script_id="$1"
     
     echo "Initializing Apps Script project..."
     
     # Create .clasp.json
     echo "Creating .clasp.json..."
     cat > .clasp.json <<EOF
   {
     "scriptId": "$script_id",
     "rootDir": "."
   }
   EOF
     
     # Create .gitignore
     echo "Creating .gitignore..."
     cat > .gitignore <<EOF
   .clasp.json
   EOF
     
     # Pull the project files
     echo "Pulling project files..."
     clasp pull
     
     # Initialize git if not already a repo
     if [ ! -d .git ]; then
       echo "Initializing git repository..."
       git init
     fi
     
     # Create pre-push hook
     echo "Creating pre-push git hook..."
     mkdir -p .git/hooks
     cat > .git/hooks/pre-push <<'HOOK'
   #!/bin/sh
   
   # Run clasp push before pushing to git
   echo "Running clasp push..."
   clasp push
   
   # Check if clasp push was successful
   if [ $? -ne 0 ]; then
     echo "Error: clasp push failed. Aborting git push."
     exit 1
   fi
   
   echo "clasp push successful. Proceeding with git push..."
   exit 0
   HOOK
     chmod +x .git/hooks/pre-push
     
     echo "✅ Apps Script project initialized successfully!"
     echo "Files created: .clasp.json, .gitignore, .git/hooks/pre-push"
   }
   ```

3. Save and exit (`Ctrl+X`, then `Y`, then `Enter` in nano)

4. Reload your shell configuration:
   ```bash
   source ~/.bashrc
   # or
   source ~/.bash_profile
   ```

</details>

<details>
<summary><b>macOS/Linux (Zsh)</b></summary>

1. Open your `.zshrc` file:
   ```bash
   nano ~/.zshrc
   ```

2. Add the same function from the Bash section above

3. Save and exit

4. Reload your shell configuration:
   ```bash
   source ~/.zshrc
   ```

</details>

<details>
<summary><b>Windows (Git Bash)</b></summary>

1. Open your `.bashrc` file:
   ```bash
   nano ~/.bashrc
   ```

2. Add the same function from the Bash section above

3. Save and reload:
   ```bash
   source ~/.bashrc
   ```

</details>

<details>
<summary><b>Windows (PowerShell)</b></summary>

1. Open your PowerShell profile:
   ```powershell
   notepad $PROFILE
   ```

2. Add the following function:
   ```powershell
   function clasp-init {
       param(
           [Parameter(Mandatory=$true)]
           [string]$scriptId
       )
       
       Write-Host "Initializing Apps Script project..."
       
       # Create .clasp.json
       Write-Host "Creating .clasp.json..."
       @"
   {
     "scriptId": "$scriptId",
     "rootDir": "."
   }
   "@ | Out-File -FilePath .clasp.json -Encoding utf8
       
       # Create .gitignore
       Write-Host "Creating .gitignore..."
       ".clasp.json" | Out-File -FilePath .gitignore -Encoding utf8
       
       # Create .claspignore
       Write-Host "Creating .claspignore..."
       ".gitignore" | Out-File -FilePath .claspignore -Encoding utf8
       
       # Pull the project files
       Write-Host "Pulling project files..."
       clasp pull
       
       # Initialize git if not already a repo
       if (-not (Test-Path .git)) {
           Write-Host "Initializing git repository..."
           git init
       }
       
       # Create pre-push hook
       Write-Host "Creating pre-push git hook..."
       New-Item -ItemType Directory -Force -Path .git/hooks | Out-Null
       @"
   #!/bin/sh
   
   # Run clasp push before pushing to git
   echo "Running clasp push..."
   clasp push
   
   # Check if clasp push was successful
   if [ `$? -ne 0 ]; then
     echo "Error: clasp push failed. Aborting git push."
     exit 1
   fi
   
   echo "clasp push successful. Proceeding with git push..."
   exit 0
   "@ | Out-File -FilePath .git/hooks/pre-push -Encoding utf8
       
       Write-Host "✅ Apps Script project initialized successfully!"
       Write-Host "Files created: .clasp.json, .gitignore, .claspignore, .git/hooks/pre-push"
   }
   ```

3. Save and reload:
   ```powershell
   . $PROFILE
   ```

</details>

---

## 🎯 Quick Start

### Step 1: Get Your Script ID

1. Open your Apps Script project in the browser
2. The URL will look like: 
   ```
   https://script.google.com/home/projects/YOUR_SCRIPT_ID/edit
   ```
3. Copy the `YOUR_SCRIPT_ID` part

### Step 2: Initialize Your Project

```bash
# Create and navigate to your project directory
mkdir my-apps-script-project
cd my-apps-script-project

# Initialize with your script ID
clasp-init YOUR_SCRIPT_ID
```

**Example:**
```bash
clasp-init 1KkDHnvTJLdlN6nNYKLkd6kE8p8E1eEYnnii6QBqwYkkwqk9JDnDf9UKJ
```

---

## 🔍 What Does It Do?

The `clasp-init` function automatically:

| Step | Action | Description |
|------|--------|-------------|
| 1️⃣ | Creates `.clasp.json` | Configuration file with your script ID |
| 2️⃣ | Creates `.gitignore` | Prevents committing sensitive script IDs |
| 3️⃣ | Pulls project files | Downloads your Apps Script files (`Code.js`, `appsscript.json`, etc.) |
| 4️⃣ | Initializes Git | Creates a git repository (if needed) |
| 5️⃣ | Sets up pre-push hook | Auto-runs `clasp push` before `git push` |

---

## 💻 Daily Workflow

After initialization, your workflow is beautifully simple:

```bash
# 1. Make changes to your local files
vim Code.js

# 2. Commit changes to git
git add .
git commit -m "Add new feature"

# 3. Push to git - automatically syncs to Apps Script first!
git push
```

> **🛡️ Protection**: If `clasp push` fails, the git push is automatically aborted, keeping your repos in sync.

---

## 🔧 Troubleshooting

<details>
<summary><b>Function not found</b></summary>

- Make sure you reloaded your shell configuration after adding the function:
  ```bash
  source ~/.zshrc  # or ~/.bashrc
  ```
- Try opening a new terminal window
- Verify the function was added correctly:
  ```bash
  type clasp-init
  ```
</details>

<details>
<summary><b>clasp command not found</b></summary>

- Install clasp globally:
  ```bash
  npm install -g @google/clasp
  ```
- Verify npm is in your PATH:
  ```bash
  npm --version
  ```
</details>

<details>
<summary><b>Permission denied / Not logged in</b></summary>

- Authenticate with Google:
  ```bash
  clasp login
  ```
- Verify you have access to the Apps Script project
- Check your `.clasprc.json` exists in your home directory
</details>

<details>
<summary><b>Git hook not working</b></summary>

- Verify the hook is executable:
  ```bash
  chmod +x .git/hooks/pre-push
  ```
- Test the hook manually:
  ```bash
  .git/hooks/pre-push
  ```
</details>

---

## 🎁 Benefits

| Benefit | Description |
|---------|-------------|
| ⚡ **Fast Setup** | Initialize new projects in seconds, not minutes |
| 🔄 **Auto-Sync** | Never forget to push to Apps Script again |
| 🔒 **Secure** | Script IDs stay out of version control |
| 🎯 **Consistent** | Same structure across all your projects |
| 🛡️ **Safe** | Prevents desync between Git and Apps Script |
| 🧹 **Clean** | No dev files cluttering your Apps Script project |

---

## 📚 Additional Resources

- [Clasp Documentation](https://github.com/google/clasp)
- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Git Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

---

## 📝 License

Feel free to use and modify this setup for your projects!

---

<p align="center">Made with ❤️ for Apps Script developers</p>
