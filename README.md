# Jira AI Comment Helper

A Chrome extension that reads Jira stories from the page and drafts intelligent comments using ChatGPT/OpenAI. This tool helps streamline your workflow by automatically generating contextual comments, code reviews, and suggestions based on the Jira story content.

## 🚀 Features

- Automatically reads Jira story content from the current page
- Generates contextual comments using OpenAI's GPT models
- One-click integration with Jira comment system
- Customizable AI prompts for different comment types
- Secure API key management
- Works with Jira Cloud and Server instances

## 📋 Prerequisites

- Google Chrome browser
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Access to Jira instance (Cloud or Server)

## 🛠️ Installation Instructions

### Step 1: Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy and save your API key securely

### Step 2: Download or Clone the Extension

```bash
git clone https://github.com/IvanovvAlex/jira-ai-comment-helper.git
cd jira-ai-comment-helper
```

### Step 3: Create Extension Files

Create the following file structure in your project directory:

```
jira-ai-comment-helper/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── background.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Step 4: Copy-Paste Extension Files

#### `manifest.json`
```json
{
  "manifest_version": 3,
  "name": "Jira AI Comment Helper",
  "version": "1.0.0",
  "description": "AI-powered comment generation for Jira stories using OpenAI",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://*.atlassian.net/*",
    "https://*.jira.com/*",
    "https://api.openai.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://*.atlassian.net/*",
        "https://*.jira.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Jira AI Comment Helper",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

#### `popup.html`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 Jira AI Helper</h1>
    </div>
    
    <div class="section">
      <label for="apiKey">OpenAI API Key:</label>
      <input type="password" id="apiKey" placeholder="sk-...">
      <button id="saveKey">Save</button>
    </div>
    
    <div class="section">
      <label for="commentType">Comment Type:</label>
      <select id="commentType">
        <option value="general">General Comment</option>
        <option value="code_review">Code Review</option>
        <option value="testing">Testing Notes</option>
        <option value="improvement">Improvement Suggestion</option>
      </select>
    </div>
    
    <div class="section">
      <button id="generateComment" class="primary-btn">Generate AI Comment</button>
    </div>
    
    <div class="section">
      <label for="generatedComment">Generated Comment:</label>
      <textarea id="generatedComment" rows="6" readonly></textarea>
      <button id="copyComment">Copy to Clipboard</button>
      <button id="insertComment">Insert into Jira</button>
    </div>
    
    <div class="status" id="status"></div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

#### `popup.css`
```css
body {
  width: 400px;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

.container {
  padding: 16px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #0052CC;
  font-size: 18px;
}

.section {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #0052CC;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 4px;
  margin-right: 8px;
}

.primary-btn {
  background-color: #0052CC;
  color: white;
  width: 100%;
  padding: 12px;
  font-weight: 500;
}

.primary-btn:hover {
  background-color: #0043A6;
}

button:not(.primary-btn) {
  background-color: #f4f5f7;
  color: #333;
  border: 1px solid #ddd;
}

button:not(.primary-btn):hover {
  background-color: #e4e6ea;
}

.status {
  margin-top: 16px;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.status.success {
  background-color: #e3fcef;
  color: #006644;
  border: 1px solid #79e2a0;
}

.status.error {
  background-color: #ffebe6;
  color: #d04437;
  border: 1px solid #ff8b73;
}

.status.info {
  background-color: #deebff;
  color: #0052cc;
  border: 1px solid #4c9aff;
}

textarea {
  resize: vertical;
  min-height: 100px;
}
```

#### `popup.js`
```javascript
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const commentTypeSelect = document.getElementById('commentType');
  const generateBtn = document.getElementById('generateComment');
  const generatedTextarea = document.getElementById('generatedComment');
  const copyBtn = document.getElementById('copyComment');
  const insertBtn = document.getElementById('insertComment');
  const statusDiv = document.getElementById('status');

  // Load saved API key
  chrome.storage.sync.get(['openaiApiKey'], function(result) {
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
    }
  });

  // Save API key
  saveKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.sync.set({openaiApiKey: apiKey}, function() {
        showStatus('API key saved successfully!', 'success');
      });
    } else {
      showStatus('Please enter a valid API key', 'error');
    }
  });

  // Generate comment
  generateBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus('Please save your OpenAI API key first', 'error');
      return;
    }

    showStatus('Generating comment...', 'info');
    generateBtn.disabled = true;

    try {
      // Get Jira story content from active tab
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      const results = await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: extractJiraContent
      });

      const jiraContent = results[0].result;
      if (!jiraContent.title) {
        showStatus('No Jira story found on this page', 'error');
        return;
      }

      // Generate AI comment
      const comment = await generateAIComment(apiKey, jiraContent, commentTypeSelect.value);
      generatedTextarea.value = comment;
      showStatus('Comment generated successfully!', 'success');
      
    } catch (error) {
      console.error('Error generating comment:', error);
      showStatus('Error generating comment: ' + error.message, 'error');
    } finally {
      generateBtn.disabled = false;
    }
  });

  // Copy to clipboard
  copyBtn.addEventListener('click', function() {
    generatedTextarea.select();
    document.execCommand('copy');
    showStatus('Comment copied to clipboard!', 'success');
  });

  // Insert into Jira
  insertBtn.addEventListener('click', async function() {
    const comment = generatedTextarea.value;
    if (!comment) {
      showStatus('No comment to insert', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: insertCommentIntoJira,
        args: [comment]
      });
      showStatus('Comment inserted into Jira!', 'success');
    } catch (error) {
      console.error('Error inserting comment:', error);
      showStatus('Error inserting comment: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }

  async function generateAIComment(apiKey, jiraContent, commentType) {
    const prompts = {
      general: "Based on the following Jira story, write a helpful and professional comment that provides insights, asks relevant questions, or offers suggestions:",
      code_review: "Based on the following Jira story, write a code review comment focusing on technical implementation, potential issues, and best practices:",
      testing: "Based on the following Jira story, write a testing-focused comment that suggests test cases, edge cases, and testing strategies:",
      improvement: "Based on the following Jira story, write a comment suggesting improvements, optimizations, or alternative approaches:"
    };

    const prompt = `${prompts[commentType]}

Story Title: ${jiraContent.title}
Description: ${jiraContent.description}
Acceptance Criteria: ${jiraContent.acceptanceCriteria}
Labels: ${jiraContent.labels}

Please provide a concise, actionable comment that adds value to the discussion.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes professional, concise comments for Jira stories. Focus on being actionable and valuable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
});

// Function to extract Jira content (injected into page)
function extractJiraContent() {
  const result = {
    title: '',
    description: '',
    acceptanceCriteria: '',
    labels: ''
  };

  // Extract title
  const titleElement = document.querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]') ||
                      document.querySelector('#summary-val') ||
                      document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]');
  if (titleElement) {
    result.title = titleElement.textContent.trim();
  }

  // Extract description
  const descriptionElement = document.querySelector('[data-test-id="issue.views.issue-base.foundation.description.view"] .ak-renderer-document') ||
                           document.querySelector('#description-val .user-content-block') ||
                           document.querySelector('.description .user-content-block');
  if (descriptionElement) {
    result.description = descriptionElement.textContent.trim();
  }

  // Extract acceptance criteria (often in description or custom fields)
  const acElement = document.querySelector('[data-test-id*="acceptance"]') ||
                   document.querySelector('.acceptance-criteria');
  if (acElement) {
    result.acceptanceCriteria = acElement.textContent.trim();
  }

  // Extract labels
  const labelElements = document.querySelectorAll('[data-test-id="issue.views.field.labels.label"]') ||
                       document.querySelectorAll('.labels .lozenge');
  if (labelElements.length > 0) {
    result.labels = Array.from(labelElements).map(el => el.textContent.trim()).join(', ');
  }

  return result;
}

// Function to insert comment into Jira (injected into page)
function insertCommentIntoJira(comment) {
  // Try to find the comment textarea
  const commentTextarea = document.querySelector('[data-test-id="issue.views.issue-base.foundation.quickadd.quickadd-comment.textarea"]') ||
                         document.querySelector('#comment') ||
                         document.querySelector('[placeholder*="comment" i]') ||
                         document.querySelector('textarea[aria-label*="comment" i]');

  if (commentTextarea) {
    // Focus and insert the comment
    commentTextarea.focus();
    commentTextarea.value = comment;
    
    // Trigger input events to ensure Jira recognizes the change
    commentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    commentTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  throw new Error('Could not find comment textarea on this page');
}
```

#### `content.js`
```javascript
// Content script for enhanced Jira integration
(function() {
  'use strict';

  // Add a floating button for quick access
  let floatingButton = null;

  function createFloatingButton() {
    if (floatingButton) return;

    floatingButton = document.createElement('div');
    floatingButton.innerHTML = '🤖';
    floatingButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: #0052CC;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 24px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;

    floatingButton.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
    });

    floatingButton.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });

    floatingButton.addEventListener('click', function() {
      // Open extension popup or trigger comment generation
      chrome.runtime.sendMessage({action: 'openPopup'});
    });

    document.body.appendChild(floatingButton);
  }

  // Check if we're on a Jira issue page
  function isJiraIssuePage() {
    return window.location.href.includes('/browse/') || 
           document.querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]') ||
           document.querySelector('#summary-val');
  }

  // Initialize when page loads
  function init() {
    if (isJiraIssuePage()) {
      createFloatingButton();
    }
  }

  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(init, 1000); // Wait for page to update
    }
  }).observe(document, { subtree: true, childList: true });

})();
```

#### `background.js`
```javascript
// Background service worker
chrome.runtime.onInstalled.addListener(function() {
  console.log('Jira AI Comment Helper installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'openPopup') {
    // This will be handled by the browser action click
    chrome.action.openPopup();
  }
});

// Optional: Add context menu integration
chrome.contextMenus.create({
  id: "generateAIComment",
  title: "Generate AI Comment",
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "generateAIComment") {
    chrome.action.openPopup();
  }
});
```

### Step 5: Add Extension Icons

Create an `icons` folder and add three icon files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

You can create simple icons or download them from icon libraries like [Material Icons](https://fonts.google.com/icons) or [Feather Icons](https://feathericons.com/).

### Step 6: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select your `jira-ai-comment-helper` folder
5. The extension should now appear in your extensions list

## ⚙️ Configuration

### Setting Up Your OpenAI API Key

1. Click the extension icon in your browser toolbar
2. Enter your OpenAI API key in the "OpenAI API Key" field
3. Click "Save"
4. Your API key is stored securely in Chrome's local storage

### Using the Extension

1. Navigate to any Jira story page
2. Click the extension icon or the floating 🤖 button
3. Select your desired comment type:
   - **General Comment**: Basic insights and questions
   - **Code Review**: Technical implementation feedback
   - **Testing**: Test cases and strategies
   - **Improvement**: Optimization suggestions
4. Click "Generate AI Comment"
5. Review the generated comment
6. Either copy to clipboard or insert directly into Jira

## 🧪 Testing Your Extension

### Test on Sample Jira Stories

1. Open a Jira story with good description and acceptance criteria
2. Try different comment types to see varied outputs
3. Test the "Insert into Jira" functionality
4. Verify the floating button appears on Jira pages

### Troubleshooting

**Extension not loading:**
- Check that all files are in the correct locations
- Verify manifest.json syntax using a JSON validator
- Check Chrome Extensions page for error messages

**AI comments not generating:**
- Verify your OpenAI API key is valid and has credits
- Check browser console for error messages
- Ensure you're on a valid Jira story page

**Comment insertion not working:**
- Different Jira instances may have different selectors
- Check browser console for errors
- Try copying the comment manually as a fallback

## 🔒 Security Considerations

### API Key Safety
- ✅ API keys are stored locally in Chrome's secure storage
- ✅ Keys are never transmitted to third parties
- ✅ Extension only communicates with OpenAI's official API
- ⚠️ **Important**: Never share your OpenAI API key with others

### Permissions
The extension requests minimal permissions:
- `activeTab`: To read Jira story content from current page
- `storage`: To securely store your API key
- `scripting`: To insert generated comments into Jira

### Data Privacy
- No story content is stored by the extension
- All data is processed client-side
- Communications are only between your browser and OpenAI

## 🔧 Customization

### Modifying AI Prompts

Edit the `prompts` object in `popup.js` to customize how the AI generates comments:

```javascript
const prompts = {
  general: "Your custom prompt here...",
  code_review: "Your code review prompt...",
  // Add new comment types
  custom_type: "Your custom prompt..."
};
```

### Adding New Comment Types

1. Add new option to `commentType` select in `popup.html`
2. Add corresponding prompt in `popup.js`
3. Reload the extension

### Styling Changes

Modify `popup.css` to match your preferred color scheme or layout.

## 📝 Advanced Features

### Custom Field Extraction

Modify the `extractJiraContent()` function to capture additional Jira fields:

```javascript
// Extract custom fields
const customField = document.querySelector('[data-test-id="your-custom-field"]');
if (customField) {
  result.customField = customField.textContent.trim();
}
```

### Integration with Other AI Models

Replace the OpenAI API call with other providers by modifying the `generateAIComment()` function.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Look for error messages in the browser console
3. Open an issue on GitHub with detailed information

---

**Happy commenting! 🚀**