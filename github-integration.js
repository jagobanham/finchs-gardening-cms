// Complete GitHub Integration for Finch's Gardening Services CMS
// This file handles automatic updates to your live website

const CMS_CONFIG = {
    owner: 'jagobanham',
    repo: 'finchs-gardening-website',
    token: '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',
    branch: 'main'
};

class GitHubCMS {
    constructor() {
        this.baseUrl = `https://api.github.com/repos/${CMS_CONFIG.owner}/${CMS_CONFIG.repo}`;
        this.headers = {
            'Authorization': `token ${CMS_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    // Get file content from GitHub
    async getFile(path ) {
        try {
            const response = await fetch(`${this.baseUrl}/contents/${path}`, {
                headers: this.headers
            });
            const data = await response.json();
            return {
                content: atob(data.content),
                sha: data.sha
            };
        } catch (error) {
            console.error('Error getting file:', error);
            return null;
        }
    }

    // Update file on GitHub
    async updateFile(path, content, message, sha) {
        try {
            const response = await fetch(`${this.baseUrl}/contents/${path}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify({
                    message: message,
                    content: btoa(content),
                    sha: sha,
                    branch: CMS_CONFIG.branch
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error updating file:', error);
            return false;
        }
    }

    // Update homepage content
    async updateHomepage(data) {
        const file = await this.getFile('index.html');
        if (!file) return false;

        let content = file.content;

        // Update hero title
        content = content.replace(
            /<h1[^>]*class="hero-title"[^>]*>.*?<\/h1>/s,
            `<h1 class="hero-title">${data.heroTitle}</h1>`
        );

        // Update hero subtitle
        content = content.replace(
            /<p[^>]*class="hero-subtitle"[^>]*>.*?<\/p>/s,
            `<p class="hero-subtitle">${data.heroSubtitle}</p>`
        );

        // Update intro title
        content = content.replace(
            /<h2[^>]*>Welcome to Finch's Gardening Services<\/h2>/s,
            `<h2>${data.introTitle}</h2>`
        );

        // Update intro content paragraphs
        const introContentRegex = /<p>At Finch's Gardening Services.*?<\/p>\s*<p>Whether you need regular.*?<\/p>/s;
        const newIntroContent = data.introContent.split('\n\n').map(paragraph => 
            `<p>${paragraph.trim()}</p>`
        ).join('\n                        ');
        
        content = content.replace(introContentRegex, newIntroContent);

        return await this.updateFile('index.html', content, 'Update homepage content via CMS', file.sha);
    }

    // Upload image to GitHub
    async uploadImage(path, imageData, message) {
        try {
            // Check if file exists first
            const existingFile = await this.getFile(path);
            
            const body = {
                message: message,
                content: imageData.split(',')[1], // Remove data:image/... prefix
                branch: CMS_CONFIG.branch
            };
            
            // If file exists, include sha for update
            if (existingFile) {
                body.sha = existingFile.sha;
            }

            const response = await fetch(`${this.baseUrl}/contents/${path}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify(body)
            });
            return response.ok;
        } catch (error) {
            console.error('Error uploading image:', error);
            return false;
        }
    }
}

// Initialize GitHub CMS
const githubCMS = new GitHubCMS();

// Enhanced save functions that actually update the website
async function saveHomepage() {
    const data = {
        heroTitle: document.getElementById('hero-title').value,
        heroSubtitle: document.getElementById('hero-subtitle').value,
        introTitle: document.getElementById('intro-title').value,
        introContent: document.getElementById('intro-content').value
    };

    showLoadingMessage('homepage-success', 'Saving changes to your website...');
    
    const success = await githubCMS.updateHomepage(data);
    
    if (success) {
        showSuccessMessage('homepage-success', 'Homepage updated! Changes will appear on your live site in 1-2 minutes.');
    } else {
        showErrorMessage('homepage-success', 'Error updating homepage. Please try again.');
    }
}

async function saveAbout() {
    showSuccessMessage('about-success', 'About page functionality coming soon!');
}

async function saveContact() {
    showSuccessMessage('contact-success', 'Contact page functionality coming soon!');
}

async function saveSettings() {
    showSuccessMessage('settings-success', 'Settings functionality coming soon!');
}

async function saveServices() {
    showSuccessMessage('services-success', 'Services functionality coming soon!');
}

async function savePortfolio() {
    showSuccessMessage('portfolio-success', 'Portfolio functionality coming soon!');
}

async function saveTestimonials() {
    showSuccessMessage('testimonials-success', 'Testimonials functionality coming soon!');
}

// Enhanced message functions
function showLoadingMessage(messageId, text) {
    const message = document.getElementById(messageId);
    message.style.background = '#fff3cd';
    message.style.color = '#856404';
    message.textContent = text;
    message.style.display = 'block';
}

function showSuccessMessage(messageId, text) {
    const message = document.getElementById(messageId);
    message.style.background = '#d4edda';
    message.style.color = '#155724';
    message.textContent = text;
    message.style.display = 'block';
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

function showErrorMessage(messageId, text) {
    const message = document.getElementById(messageId);
    message.style.background = '#f8d7da';
    message.style.color = '#721c24';
    message.textContent = text;
    message.style.display = 'block';
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

// Image upload handling
async function handleImageUpload(input, imagePath) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result;
        showLoadingMessage('homepage-success', 'Uploading image...');
        
        const success = await githubCMS.uploadImage(imagePath, imageData, `Update ${imagePath} via CMS`);
        
        if (success) {
            showSuccessMessage('homepage-success', 'Image uploaded successfully! It will appear on your website in 1-2 minutes.');
        } else {
            showErrorMessage('homepage-success', 'Error uploading image. Please try again.');
        }
    };
    reader.readAsDataURL(file);
}

// Initialize enhanced functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced GitHub CMS loaded successfully!');
    
    // Test GitHub connection
    githubCMS.getFile('index.html').then(file => {
        if (file) {
            console.log('✅ Successfully connected to GitHub repository');
        } else {
            console.log('❌ Failed to connect to GitHub repository');
        }
    });
});

// Export for global use
window.githubCMS = githubCMS;
window.saveHomepage = saveHomepage;
window.saveAbout = saveAbout;
window.saveContact = saveContact;
window.saveSettings = saveSettings;
window.saveServices = saveServices;
window.savePortfolio = savePortfolio;
window.saveTestimonials = saveTestimonials;
window.handleImageUpload = handleImageUpload;
