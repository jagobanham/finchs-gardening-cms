// Complete GitHub Integration for Finch's Gardening Services
// This handles ALL website content updates including links and buttons

const CMS_CONFIG = {
    owner: 'jagobanham',
    repo: 'finchs-gardening-website',
    token: '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',
    branch: 'main'
};

class CompleteWebsiteCMS {
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
                    content: btoa(unescape(encodeURIComponent(content))),
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

        // Update CTA button
        content = content.replace(
            /<a[^>]*class="cta-button"[^>]*>.*?<\/a>/s,
            `<a href="${data.ctaLink}" class="cta-button">${data.ctaText}</a>`
        );

        // Update welcome title
        content = content.replace(
            /<h2[^>]*>Welcome to Finch's Gardening Services<\/h2>/s,
            `<h2>${data.welcomeTitle}</h2>`
        );

        // Update welcome content
        const welcomeRegex = /<p>At Finch's Gardening Services.*?help your garden thrive\.<\/p>/s;
        content = content.replace(welcomeRegex, `<p>${data.welcomeContent}</p>`);

        return await this.updateFile('index.html', content, 'Update homepage via CMS', file.sha);
    }

    // Update about page
    async updateAbout(data) {
        const file = await this.getFile('about.html');
        if (!file) return false;

        let content = file.content;

        // Update page title
        content = content.replace(
            /<h1[^>]*>About Us<\/h1>/s,
            `<h1>${data.pageTitle}</h1>`
        );

        // Update story title
        content = content.replace(
            /<h2[^>]*>Our Story<\/h2>/s,
            `<h2>${data.storyTitle}</h2>`
        );

        // Update story content
        content = content.replace(
            /<p>Finch's Gardening Services was founded.*?surrounding areas\.<\/p>/s,
            `<p>${data.storyContent}</p>`
        );

        return await this.updateFile('about.html', content, 'Update about page via CMS', file.sha);
    }

    // Update contact information
    async updateContact(data) {
        const file = await this.getFile('contact.html');
        if (!file) return false;

        let content = file.content;

        // Update phone numbers
        content = content.replace(/\+44 1372 123456/g, data.phone);
        content = content.replace(/tel:\+441372123456/g, `tel:${data.phone.replace(/\s/g, '')}`);

        // Update email
        content = content.replace(/info@finchsgardening\.co\.uk/g, data.email);
        content = content.replace(/mailto:info@finchsgardening\.co\.uk/g, `mailto:${data.email}`);

        // Update business hours
        content = content.replace(
            /Monday - Friday: 8:00 AM - 6:00 PM/g,
            `Monday - Friday: ${data.hoursWeekdays}`
        );
        content = content.replace(
            /Saturday: 8:00 AM - 4:00 PM/g,
            `Saturday: ${data.hoursSaturday}`
        );
        content = content.replace(
            /Sunday: Closed/g,
            `Sunday: ${data.hoursSunday}`
        );

        return await this.updateFile('contact.html', content, 'Update contact info via CMS', file.sha);
    }

    // Update website colors
    async updateSettings(data) {
        const file = await this.getFile('css/styles.css');
        if (!file) return false;

        let content = file.content;

        // Update CSS color variables
        content = content.replace(
            /--primary-color:\s*#[0-9a-fA-F]{6};/,
            `--primary-color: ${data.primaryColor};`
        );
        content = content.replace(
            /--secondary-color:\s*#[0-9a-fA-F]{6};/,
            `--secondary-color: ${data.secondaryColor};`
        );
        content = content.replace(
            /--accent-color:\s*#[0-9a-fA-F]{6};/,
            `--accent-color: ${data.accentColor};`
        );

        return await this.updateFile('css/styles.css', content, 'Update website colors via CMS', file.sha);
    }

    // Upload image
    async uploadImage(path, imageData, message) {
        try {
            const existingFile = await this.getFile(path);
            
            const body = {
                message: message,
                content: imageData.split(',')[1],
                branch: CMS_CONFIG.branch
            };
            
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

// Initialize
const completeCMS = new CompleteWebsiteCMS();

// Save functions
async function saveHomepage() {
    const data = {
        heroTitle: document.getElementById('hero-title').value,
        heroSubtitle: document.getElementById('hero-subtitle').value,
        ctaText: document.getElementById('cta-text').value,
        ctaLink: document.getElementById('cta-link').value,
        welcomeTitle: document.getElementById('welcome-title').value,
        welcomeContent: document.getElementById('welcome-content').value
    };

    showLoadingMessage('homepage-success', '⏳ Updating homepage...');
    const success = await completeCMS.updateHomepage(data);
    
    if (success) {
        showSuccessMessage('homepage-success', '✅ Homepage updated! Changes will appear in 1-2 minutes.');
    } else {
        showErrorMessage('homepage-success', '❌ Error updating homepage. Please try again.');
    }
}

async function saveAbout() {
    const data = {
        pageTitle: document.getElementById('about-page-title').value,
        storyTitle: document.getElementById('story-title').value,
        storyContent: document.getElementById('story-content').value
    };

    showLoadingMessage('about-success', '⏳ Updating about page...');
    const success = await completeCMS.updateAbout(data);
    
    if (success) {
        showSuccessMessage('about-success', '✅ About page updated successfully!');
    } else {
        showErrorMessage('about-success', '❌ Error updating about page.');
    }
}

async function saveContact() {
    const data = {
        phone: document.getElementById('contact-phone').value,
        email: document.getElementById('contact-email').value,
        hoursWeekdays: document.getElementById('hours-weekdays').value,
        hoursSaturday: document.getElementById('hours-saturday').value,
        hoursSunday: document.getElementById('hours-sunday').value
    };

    showLoadingMessage('contact-success', '⏳ Updating contact information...');
    const success = await completeCMS.updateContact(data);
    
    if (success) {
        showSuccessMessage('contact-success', '✅ Contact information updated!');
    } else {
        showErrorMessage('contact-success', '❌ Error updating contact information.');
    }
}

async function saveSettings() {
    const data = {
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        accentColor: document.getElementById('accent-color').value
    };

    showLoadingMessage('settings-success', '⏳ Updating website colors...');
    const success = await completeCMS.updateSettings(data);
    
    if (success) {
        showSuccessMessage('settings-success', '✅ Website colors updated!');
    } else {
        showErrorMessage('settings-success', '❌ Error updating colors.');
    }
}

// Message functions
function showLoadingMessage(id, text) {
    const msg = document.getElementById(id);
    msg.style.background = '#fff3cd';
    msg.style.color = '#856404';
    msg.textContent = text;
    msg.style.display = 'block';
}

function showSuccessMessage(id, text) {
    const msg = document.getElementById(id);
    msg.style.background = '#d4edda';
    msg.style.color = '#155724';
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 8000);
}

function showErrorMessage(id, text) {
    const msg = document.getElementById(id);
    msg.style.background = '#f8d7da';
    msg.style.color = '#721c24';
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 8000);
}

// Image upload
async function handleImageUpload(input, imagePath) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        showLoadingMessage('homepage-success', '⏳ Uploading image...');
        const success = await completeCMS.uploadImage(imagePath, e.target.result, `Update ${imagePath}`);
        
        if (success) {
            showSuccessMessage('homepage-success', '✅ Image uploaded successfully!');
        } else {
            showErrorMessage('homepage-success', '❌ Error uploading image.');
        }
    };
    reader.readAsDataURL(file);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌿 Complete CMS loaded!');
    
    completeCMS.getFile('index.html').then(file => {
        if (file) {
            console.log('✅ Connected to GitHub');
        } else {
            console.log('❌ GitHub connection failed');
        }
    });
});

// Export functions
window.completeCMS = completeCMS;
window.saveHomepage = saveHomepage;
window.saveAbout = saveAbout;
window.saveContact = saveContact;
window.saveSettings = saveSettings;
window.handleImageUpload = handleImageUpload;
