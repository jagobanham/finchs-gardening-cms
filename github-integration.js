// GitHub Integration for Finch's Gardening CMS
// This handles automatic updates to your Netlify site

class GitHubCMS {
    constructor(config) {
        this.owner = config.owner;
        this.repo = config.repo;
        this.token = config.token;
        this.baseUrl = 'https://api.github.com';
    }

    // Update a file in the GitHub repository
    async updateFile(path, content, message) {
        try {
            // Get the current file to get its SHA
            const currentFile = await this.getFile(path);
            
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    content: btoa(content), // Base64 encode the content
                    sha: currentFile.sha
                })
            });

            if (response.ok) {
                console.log(`✅ Successfully updated ${path}`);
                this.showNotification('success', `Updated ${path} successfully!`);
                return await response.json();
            } else {
                throw new Error(`Failed to update ${path}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error updating file:', error);
            this.showNotification('error', `Failed to update ${path}: ${error.message}`);
            throw error;
        }
    }

    // Get a file from the repository
    async getFile(path) {
        try {
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                }
            });

            if (response.ok) {
                return await response.json();
            } else if (response.status === 404) {
                // File doesn't exist, return null
                return null;
            } else {
                throw new Error(`Failed to get ${path}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error getting file:', error);
            throw error;
        }
    }

    // Upload an image to the repository
    async uploadImage(file, path) {
        try {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = async () => {
                    try {
                        const base64Content = reader.result.split(',')[1]; // Remove data:image/... prefix
                        
                        const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `token ${this.token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: `Upload image: ${path}`,
                                content: base64Content
                            })
                        });

                        if (response.ok) {
                            console.log(`✅ Successfully uploaded image ${path}`);
                            this.showNotification('success', `Image uploaded successfully!`);
                            resolve(await response.json());
                        } else {
                            throw new Error(`Failed to upload image: ${response.statusText}`);
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            this.showNotification('error', `Failed to upload image: ${error.message}`);
            throw error;
        }
    }

    // Update homepage content
    async updateHomepage(data) {
        try {
            // Get the current index.html file
            const currentFile = await this.getFile('index.html');
            if (!currentFile) {
                throw new Error('index.html not found in repository');
            }

            // Decode the current content
            let htmlContent = atob(currentFile.content);

            // Update the content with new data
            htmlContent = this.replaceHtmlContent(htmlContent, {
                'hero__title': data.heroTitle,
                'hero__subtitle': data.heroSubtitle,
                'intro__title': data.introTitle,
                'intro__content': data.introContent
            });

            // Update the file in GitHub
            await this.updateFile('index.html', htmlContent, 'Update homepage content via CMS');
            
            return true;
        } catch (error) {
            console.error('❌ Error updating homepage:', error);
            throw error;
        }
    }

    // Update about page content
    async updateAbout(data) {
        try {
            const currentFile = await this.getFile('about.html');
            if (!currentFile) {
                throw new Error('about.html not found in repository');
            }

            let htmlContent = atob(currentFile.content);

            htmlContent = this.replaceHtmlContent(htmlContent, {
                'story__title': data.storyTitle,
                'story__content': data.storyContent
            });

            await this.updateFile('about.html', htmlContent, 'Update about page content via CMS');
            
            return true;
        } catch (error) {
            console.error('❌ Error updating about page:', error);
            throw error;
        }
    }

    // Update contact information
    async updateContact(data) {
        try {
            const currentFile = await this.getFile('contact.html');
            if (!currentFile) {
                throw new Error('contact.html not found in repository');
            }

            let htmlContent = atob(currentFile.content);

            htmlContent = this.replaceHtmlContent(htmlContent, {
                'contact-phone': data.phone,
                'contact-email': data.email,
                'service-area': data.serviceArea,
                'hours-weekdays': data.hoursWeekdays,
                'hours-saturday': data.hoursSaturday,
                'hours-sunday': data.hoursSunday
            });

            await this.updateFile('contact.html', htmlContent, 'Update contact information via CMS');
            
            return true;
        } catch (error) {
            console.error('❌ Error updating contact page:', error);
            throw error;
        }
    }

    // Update CSS with new colors
    async updateColors(colors) {
        try {
            const currentFile = await this.getFile('css/styles.css');
            if (!currentFile) {
                throw new Error('css/styles.css not found in repository');
            }

            let cssContent = atob(currentFile.content);

            // Replace CSS color variables
            cssContent = cssContent.replace(/--primary-color:\s*#[0-9a-fA-F]{6};/, `--primary-color: ${colors.primaryColor};`);
            cssContent = cssContent.replace(/--secondary-color:\s*#[0-9a-fA-F]{6};/, `--secondary-color: ${colors.secondaryColor};`);
            cssContent = cssContent.replace(/--accent-color:\s*#[0-9a-fA-F]{6};/, `--accent-color: ${colors.accentColor};`);

            await this.updateFile('css/styles.css', cssContent, 'Update website colors via CMS');
            
            return true;
        } catch (error) {
            console.error('❌ Error updating colors:', error);
            throw error;
        }
    }

    // Helper function to replace HTML content
    replaceHtmlContent(html, replacements) {
        let updatedHtml = html;

        for (const [className, newContent] of Object.entries(replacements)) {
            // Create regex patterns to find and replace content
            const patterns = [
                // For text content in elements with specific classes
                new RegExp(`(<[^>]*class="[^"]*${className}[^"]*"[^>]*>)([^<]*)(</[^>]*>)`, 'gi'),
                // For input values
                new RegExp(`(<input[^>]*id="${className}"[^>]*value=")[^"]*("[^>]*>)`, 'gi'),
                // For textarea content
                new RegExp(`(<textarea[^>]*id="${className}"[^>]*>)([^<]*)(</textarea>)`, 'gi')
            ];

            patterns.forEach(pattern => {
                updatedHtml = updatedHtml.replace(pattern, (match, opening, content, closing) => {
                    return opening + newContent + (closing || '');
                });
            });
        }

        return updatedHtml;
    }

    // Show notification to user
    showNotification(type, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;
        notification.textContent = message;

        // Add animation styles
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Check connection status
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                }
            });

            return response.ok;
        } catch (error) {
            console.error('❌ Connection check failed:', error);
            return false;
        }
    }
}

// Initialize the GitHub CMS
let githubCMS;

// Configuration - This will be set up during installation
const CMS_CONFIG = {
    owner: ‘jagobanham’,
    repo: 'finchs-gardening-website',
    token: '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'
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        githubCMS = new GitHubCMS(CMS_CONFIG);
        
        // Check connection
        const isConnected = await githubCMS.checkConnection();
        updateConnectionStatus(isConnected);
        
        if (isConnected) {
            console.log('✅ GitHub CMS connected successfully!');
        } else {
            console.log('❌ GitHub CMS connection failed');
        }
    } catch (error) {
        console.error('❌ Failed to initialize GitHub CMS:', error);
        updateConnectionStatus(false);
    }
});

// Update connection status indicator
function updateConnectionStatus(isConnected) {
    const indicator = document.querySelector('.status-indicator');
    if (indicator) {
        indicator.className = `status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`;
    }
}

// Enhanced save functions that integrate with GitHub
async function saveHomepage() {
    if (!githubCMS) {
        alert('GitHub CMS not initialized. Please check your configuration.');
        return;
    }

    try {
        const data = {
            heroTitle: document.getElementById('hero-title').value,
            heroSubtitle: document.getElementById('hero-subtitle').value,
            introTitle: document.getElementById('intro-title').value,
            introContent: document.getElementById('intro-content').value
        };
        
        await githubCMS.updateHomepage(data);
        showSuccessMessage('homepage-success');
        
        // Show additional success message
        githubCMS.showNotification('success', '🚀 Homepage updated! Your site will be live in 1-2 minutes.');
        
    } catch (error) {
        console.error('❌ Error saving homepage:', error);
        alert('Failed to save homepage changes. Please try again.');
    }
}

async function saveAbout() {
    if (!githubCMS) {
        alert('GitHub CMS not initialized. Please check your configuration.');
        return;
    }

    try {
        const data = {
            storyTitle: document.getElementById('story-title').value,
            storyContent: document.getElementById('story-content').value
        };
        
        await githubCMS.updateAbout(data);
        showSuccessMessage('about-success');
        
        githubCMS.showNotification('success', '🚀 About page updated! Your site will be live in 1-2 minutes.');
        
    } catch (error) {
        console.error('❌ Error saving about page:', error);
        alert('Failed to save about page changes. Please try again.');
    }
}

async function saveContact() {
    if (!githubCMS) {
        alert('GitHub CMS not initialized. Please check your configuration.');
        return;
    }

    try {
        const data = {
            phone: document.getElementById('contact-phone').value,
            email: document.getElementById('contact-email').value,
            serviceArea: document.getElementById('service-area').value,
            hoursWeekdays: document.getElementById('hours-weekdays').value,
            hoursSaturday: document.getElementById('hours-saturday').value,
            hoursSunday: document.getElementById('hours-sunday').value
        };
        
        await githubCMS.updateContact(data);
        showSuccessMessage('contact-success');
        
        githubCMS.showNotification('success', '🚀 Contact info updated! Your site will be live in 1-2 minutes.');
        
    } catch (error) {
        console.error('❌ Error saving contact info:', error);
        alert('Failed to save contact information. Please try again.');
    }
}

async function saveSettings() {
    if (!githubCMS) {
        alert('GitHub CMS not initialized. Please check your configuration.');
        return;
    }

    try {
        const colors = {
            primaryColor: document.getElementById('primary-color').value,
            secondaryColor: document.getElementById('secondary-color').value,
            accentColor: document.getElementById('accent-color').value
        };
        
        await githubCMS.updateColors(colors);
        showSuccessMessage('settings-success');
        
        githubCMS.showNotification('success', '🚀 Website colors updated! Your site will be live in 1-2 minutes.');
        
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        alert('Failed to save settings. Please try again.');
    }
}

// Image upload handler
async function handleImageUpload(file, imagePath) {
    if (!githubCMS) {
        alert('GitHub CMS not initialized. Please check your configuration.');
        return;
    }

    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const fullPath = `images/${fileName}`;
        
        await githubCMS.uploadImage(file, fullPath);
        
        githubCMS.showNotification('success', '📸 Image uploaded successfully!');
        
        return fullPath;
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        return null;
    }
}

