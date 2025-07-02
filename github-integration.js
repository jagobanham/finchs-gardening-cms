// Automatic GitHub Integration System
// This handles all automatic updates to your website

const GITHUB_CONFIG = {
    owner: 'jagobanham',
    repo: 'finchs-gardening-website',
    token: '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',
    branch: 'main'
};

class AutomaticGitHubCMS {
    constructor() {
        this.baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`;
        this.headers = {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        this.fileCache = new Map();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    // Get file content and SHA from GitHub
    async getFile(path) {
        try {
            this.log(`Getting file: ${path}`);
            const response = await fetch(`${this.baseUrl}/contents/${path}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const content = atob(data.content);
            
            // Cache the file data
            this.fileCache.set(path, { content, sha: data.sha });
            
            this.log(`File retrieved successfully: ${content.length} characters`, 'success');
            return { content, sha: data.sha };
        } catch (error) {
            this.log(`Error getting file ${path}: ${error.message}`, 'error');
            throw error;
        }
    }

    // Update file on GitHub
    async updateFile(path, content, message) {
        try {
            this.log(`Updating file: ${path}`);
            
            // Get current file data if not cached
            let fileData = this.fileCache.get(path);
            if (!fileData) {
                fileData = await this.getFile(path);
            }

            const response = await fetch(`${this.baseUrl}/contents/${path}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify({
                    message: message || `CMS Update: ${path}`,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: fileData.sha,
                    branch: GITHUB_CONFIG.branch
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP ${response.status}: ${errorData.message}`);
            }

            const result = await response.json();
            
            // Update cache with new SHA
            this.fileCache.set(path, { content, sha: result.content.sha });
            
            this.log(`File updated successfully: ${path}`, 'success');
            return result;
        } catch (error) {
            this.log(`Error updating file ${path}: ${error.message}`, 'error');
            throw error;
        }
    }

    // Update homepage content
    async updateHomepage(data) {
        try {
            this.log('Updating homepage with new content...');
            
            const fileData = await this.getFile('index.html');
            let content = fileData.content;

            // Update hero section
            content = this.updateHeroSection(content, data);
            
            // Update welcome section
            content = this.updateWelcomeSection(content, data);
            
            // Update contact information
            content = this.updateContactInfo(content, data);
            
            // Update colors
            content = this.updateColors(content, data);

            await this.updateFile('index.html', content, 'CMS: Updated homepage content');
            
            this.log('Homepage updated successfully!', 'success');
            return true;
        } catch (error) {
            this.log(`Homepage update failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Update hero section
    updateHeroSection(content, data) {
        if (data.heroTitle) {
            content = content.replace(
                /<h1 class="hero-title">[^<]*<\/h1>/,
                `<h1 class="hero-title">${data.heroTitle}</h1>`
            );
        }
        
        if (data.heroSubtitle) {
            content = content.replace(
                /<p class="hero-subtitle">[^<]*<\/p>/,
                `<p class="hero-subtitle">${data.heroSubtitle}</p>`
            );
        }
        
        if (data.ctaText) {
            content = content.replace(
                /<a href="[^"]*" class="cta-button">[^<]*<\/a>/,
                `<a href="${data.ctaLink || '#contact'}" class="cta-button">${data.ctaText}</a>`
            );
        }
        
        return content;
    }

    // Update welcome section
    updateWelcomeSection(content, data) {
        if (data.welcomeTitle) {
            content = content.replace(
                /<section class="welcome">[\s\S]*?<h2>[^<]*<\/h2>/,
                (match) => match.replace(/<h2>[^<]*<\/h2>/, `<h2>${data.welcomeTitle}</h2>`)
            );
        }
        
        if (data.welcomeContent) {
            content = content.replace(
                /<section class="welcome">[\s\S]*?<p>[^<]*<\/p>/,
                (match) => match.replace(/<p>[^<]*<\/p>/, `<p>${data.welcomeContent}</p>`)
            );
        }
        
        return content;
    }

    // Update contact information
    updateContactInfo(content, data) {
        if (data.phone) {
            // Update all phone references
            content = content.replace(/\+44 1372 123456/g, data.phone);
            content = content.replace(/tel:\+441372123456/g, `tel:${data.phone.replace(/\s/g, '')}`);
        }
        
        if (data.email) {
            // Update all email references
            content = content.replace(/info@finchsgardening\.co\.uk/g, data.email);
            content = content.replace(/mailto:info@finchsgardening\.co\.uk/g, `mailto:${data.email}`);
        }
        
        if (data.hours) {
            content = content.replace(/Monday - Friday: 8:00 AM - 6:00 PM/g, data.hours);
        }
        
        if (data.serviceArea) {
            content = content.replace(/Surrey and surrounding areas/g, data.serviceArea);
        }
        
        return content;
    }

    // Update website colors
    updateColors(content, data) {
        if (data.primaryColor || data.secondaryColor || data.accentColor) {
            const colorSection = `:root {
            --primary-color: ${data.primaryColor || '#2A5D3C'};
            --secondary-color: ${data.secondaryColor || '#4A8C5F'};
            --accent-color: ${data.accentColor || '#F2C94C'};
        }`;
            
            content = content.replace(
                /:root\s*{[^}]*}/,
                colorSection
            );
        }
        
        return content;
    }

    // Update about page
    async updateAboutPage(data) {
        try {
            this.log('Updating about page...');
            
            const fileData = await this.getFile('about.html');
            let content = fileData.content;

            if (data.aboutTitle) {
                content = content.replace(
                    /<h1>[^<]*<\/h1>/,
                    `<h1>${data.aboutTitle}</h1>`
                );
            }
            
            if (data.aboutContent) {
                content = content.replace(
                    /<section class="about-content">[\s\S]*?<p>[^<]*<\/p>/,
                    (match) => match.replace(/<p>[^<]*<\/p>/, `<p>${data.aboutContent}</p>`)
                );
            }

            await this.updateFile('about.html', content, 'CMS: Updated about page');
            
            this.log('About page updated successfully!', 'success');
            return true;
        } catch (error) {
            this.log(`About page update failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Update services page
    async updateServicesPage(services) {
        try {
            this.log('Updating services page...');
            
            const fileData = await this.getFile('services.html');
            let content = fileData.content;

            // Update each service
            services.forEach((service, index) => {
                if (service.title) {
                    content = content.replace(
                        new RegExp(`<div class="service-card">([\\s\\S]*?)<h3>[^<]*</h3>`, 'g'),
                        (match, before) => `<div class="service-card">${before}<h3>${service.title}</h3>`
                    );
                }
                
                if (service.description) {
                    // This is a simplified approach - in practice you'd need more specific targeting
                    content = content.replace(
                        new RegExp(`(<h3>[^<]*</h3>[\\s\\S]*?)<p>[^<]*</p>`, 'g'),
                        (match, before) => `${before}<p>${service.description}</p>`
                    );
                }
            });

            await this.updateFile('services.html', content, 'CMS: Updated services page');
            
            this.log('Services page updated successfully!', 'success');
            return true;
        } catch (error) {
            this.log(`Services page update failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Update contact page
    async updateContactPage(data) {
        try {
            this.log('Updating contact page...');
            
            const fileData = await this.getFile('contact.html');
            let content = fileData.content;

            // Update contact information
            content = this.updateContactInfo(content, data);

            await this.updateFile('contact.html', content, 'CMS: Updated contact page');
            
            this.log('Contact page updated successfully!', 'success');
            return true;
        } catch (error) {
            this.log(`Contact page update failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Test automatic update
    async testAutomaticUpdate() {
        try {
            this.log('Testing automatic update system...');
            
            const testData = {
                heroTitle: `Test Update - ${new Date().toLocaleTimeString()}`,
                heroSubtitle: 'Testing automatic CMS updates - this proves it works!',
                ctaText: 'Test Button',
                ctaLink: '#test'
            };

            await this.updateHomepage(testData);
            
            this.log('🎉 Automatic update test SUCCESSFUL!', 'success');
            return true;
        } catch (error) {
            this.log(`Automatic update test FAILED: ${error.message}`, 'error');
            return false;
        }
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.AutomaticGitHubCMS = AutomaticGitHubCMS;
    window.GITHUB_CONFIG = GITHUB_CONFIG;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutomaticGitHubCMS, GITHUB_CONFIG };
}

// Test if run directly
if (typeof global !== 'undefined' && require.main === module) {
    const cms = new AutomaticGitHubCMS();
    cms.testAutomaticUpdate();
}

