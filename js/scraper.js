// REAL Akwam Scraper - Fetches actual data from ak.sv
class AkwamScraper {
    constructor() {
        this.baseUrl = 'https://ak.sv';
        this.cacheDuration = 3600000; // 1 hour cache
    }

    // Fetch home page content
    async fetchHomePage() {
        try {
            const cacheKey = 'akwam_home';
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(this.baseUrl)}`);
            const data = await response.json();
            const html = data.contents;
            
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const sections = [];
            
            // Extract latest movies
            const moviesSection = this.extractSection(doc, 'movies', 'أحدث الأفلام');
            if (moviesSection.items.length > 0) sections.push(moviesSection);
            
            // Extract latest series
            const seriesSection = this.extractSection(doc, 'series', 'أحدث المسلسلات');
            if (seriesSection.items.length > 0) sections.push(seriesSection);
            
            // Extract featured content
            const featuredSection = this.extractFeatured(doc);
            if (featuredSection.items.length > 0) sections.push(featuredSection);
            
            const result = { sections };
            this.saveToCache(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('Error fetching home page:', error);
            return this.getFallbackData();
        }
    }

    // Search for content
    async search(query, page = 1) {
        try {
            const cacheKey = `akwam_search_${query}_${page}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            const html = data.contents;
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const items = this.extractSearchResults(doc);
            const pagination = this.extractPagination(doc);
            
            const result = {
                query,
                items,
                pagination,
                currentPage: page
            };
            
            this.saveToCache(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('Error searching:', error);
            return { query, items: [], pagination: {} };
        }
    }

    // Get movie/series details
    async getContentDetails(url) {
        try {
            const cacheKey = `akwam_details_${btoa(url)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            const html = data.contents;
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const details = this.extractContentDetails(doc, url);
            
            this.saveToCache(cacheKey, details);
            return details;
            
        } catch (error) {
            console.error('Error fetching details:', error);
            return null;
        }
    }

    // Get video sources
    async getVideoSources(episodeUrl) {
        try {
            const cacheKey = `akwam_video_${btoa(episodeUrl)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(episodeUrl)}`);
            const data = await response.json();
            const html = data.contents;
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const sources = this.extractVideoSources(doc);
            
            this.saveToCache(cacheKey, sources, 1800000); // 30 minutes cache for videos
            return sources;
            
        } catch (error) {
            console.error('Error fetching video sources:', error);
            return [];
        }
    }

    // Helper methods
    extractSection(doc, type, title) {
        const items = [];
        const selectors = {
            'movies': 'a[href*="/movie/"], a[href*="/movies/"]',
            'series': 'a[href*="/series/"], a[href*="/tv/"]',
            'featured': '.featured-item, .highlight-item'
        };

        const selector = selectors[type] || 'div.col-lg-auto.col-md-4.col-6';
        const elements = doc.querySelectorAll(selector);
        
        elements.forEach((el, index) => {
            if (index >= 12) return; // Limit to 12 items
            
            const link = el.querySelector('a[href]');
            const img = el.querySelector('img');
            const titleEl = el.querySelector('h3, h4, .title');
            
            if (link && (img || titleEl)) {
                const item = {
                    id: this.extractIdFromUrl(link.href),
                    title: titleEl ? titleEl.textContent.trim() : 'بدون عنوان',
                    url: link.href.startsWith('http') ? link.href : `${this.baseUrl}${link.href}`,
                    poster: img ? (img.dataset.src || img.src) : null,
                    type: type,
                    year: this.extractYear(el),
                    quality: this.extractQuality(el)
                };
                
                // Clean up URL
                if (item.url.includes(this.baseUrl)) {
                    items.push(item);
                }
            }
        });

        return {
            title,
            type,
            items: items.slice(0, 12) // Ensure max 12 items
        };
    }

    extractFeatured(doc) {
        const items = [];
        const featuredElements = doc.querySelectorAll('.featured-item, .slider-item, .hero-item');
        
        featuredElements.forEach((el, index) => {
            if (index >= 6) return;
            
            const link = el.querySelector('a[href]');
            const img = el.querySelector('img');
            const titleEl = el.querySelector('h1, h2, h3, .title');
            
            if (link && titleEl) {
                items.push({
                    id: this.extractIdFromUrl(link.href),
                    title: titleEl.textContent.trim(),
                    url: link.href.startsWith('http') ? link.href : `${this.baseUrl}${link.href}`,
                    poster: img ? (img.dataset.src || img.src) : null,
                    type: 'featured',
                    description: this.extractDescription(el)
                });
            }
        });

        return {
            title: 'مميز اليوم',
            type: 'featured',
            items: items.slice(0, 6)
        };
    }

    extractSearchResults(doc) {
        const items = [];
        const resultElements = doc.querySelectorAll('.search-result, .item, .col-lg-auto, .col-md-4');
        
        resultElements.forEach(el => {
            const link = el.querySelector('a[href*="/movie/"], a[href*="/series/"], a[href*="/tv/"]');
            if (!link) return;
            
            const img = el.querySelector('img');
            const titleEl = el.querySelector('h3, h4, .title, .entry-title');
            
            if (titleEl) {
                const url = link.href.startsWith('http') ? link.href : `${this.baseUrl}${link.href}`;
                
                items.push({
                    id: this.extractIdFromUrl(url),
                    title: titleEl.textContent.trim(),
                    url: url,
                    poster: img ? (img.dataset.src || img.src) : null,
                    type: url.includes('/movie/') ? 'movie' : 'series',
                    year: this.extractYear(el),
                    quality: this.extractQuality(el)
                });
            }
        });

        return items;
    }

    extractContentDetails(doc, url) {
        const titleEl = doc.querySelector('h1.entry-title, h1.title, h1');
        const descriptionEl = doc.querySelector('.description, .synopsis, .plot, p');
        const posterEl = doc.querySelector('.poster img, .thumbnail img, img[src*="poster"]');
        const yearEl = doc.querySelector('.year, .release-date, time');
        const qualityEl = doc.querySelector('.quality, .resolution, .hd-badge');
        
        const episodes = [];
        const episodeElements = doc.querySelectorAll('.episode-item, .episode, [data-episode]');
        
        episodeElements.forEach((ep, index) => {
            const epLink = ep.querySelector('a[href*="/episode/"], a[href*="/watch/"]');
            if (epLink) {
                episodes.push({
                    id: this.extractIdFromUrl(epLink.href),
                    title: ep.querySelector('.episode-title, .title')?.textContent.trim() || `الحلقة ${index + 1}`,
                    url: epLink.href.startsWith('http') ? epLink.href : `${this.baseUrl}${epLink.href}`,
                    episodeNumber: index + 1,
                    thumbnail: ep.querySelector('img')?.src
                });
            }
        });

        return {
            id: this.extractIdFromUrl(url),
            title: titleEl ? titleEl.textContent.trim() : 'بدون عنوان',
            description: descriptionEl ? descriptionEl.textContent.trim() : '',
            poster: posterEl ? (posterEl.dataset.src || posterEl.src) : null,
            year: yearEl ? this.extractYearFromText(yearEl.textContent) : null,
            quality: qualityEl ? qualityEl.textContent.trim() : 'HD',
            type: url.includes('/movie/') ? 'movie' : 'series',
            episodes: episodes,
            url: url
        };
    }

    extractVideoSources(doc) {
        const sources = [];
        
        // Look for direct video sources
        const videoElements = doc.querySelectorAll('source[src*=".mp4"], source[src*=".m3u8"], video source');
        videoElements.forEach(source => {
            const src = source.src;
            if (src && (src.includes('.mp4') || src.includes('.m3u8'))) {
                sources.push({
                    url: src.startsWith('http') ? src : `${this.baseUrl}${src}`,
                    quality: source.getAttribute('label') || source.getAttribute('size') || 'HD',
                    type: 'video/mp4'
                });
            }
        });

        // Look for iframe embeds
        const iframes = doc.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]');
        iframes.forEach(iframe => {
            sources.push({
                url: iframe.src,
                quality: 'HD',
                type: 'embed'
            });
        });

        // Look for video links in scripts
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => {
            const text = script.textContent;
            const videoUrls = text.match(/(https?:\/\/[^\s"']*\.(?:mp4|m3u8|webm|mkv)[^\s"']*)/gi);
            if (videoUrls) {
                videoUrls.forEach(url => {
                    sources.push({
                        url: url,
                        quality: 'HD',
                        type: 'video/mp4'
                    });
                });
            }
        });

        return sources.slice(0, 5); // Limit to 5 sources
    }

    extractPagination(doc) {
        const pagination = {
            current: 1,
            total: 1,
            hasNext: false,
            hasPrev: false
        };

        const paginationEl = doc.querySelector('.pagination, .page-numbers, .pages');
        if (paginationEl) {
            const current = paginationEl.querySelector('.current, .active');
            if (current) {
                pagination.current = parseInt(current.textContent) || 1;
            }

            const pages = paginationEl.querySelectorAll('a, .page-number');
            let maxPage = pagination.current;
            pages.forEach(page => {
                const pageNum = parseInt(page.textContent);
                if (pageNum > maxPage) maxPage = pageNum;
            });
            pagination.total = maxPage;

            pagination.hasNext = !!paginationEl.querySelector('.next, .fa-chevron-right');
            pagination.hasPrev = !!paginationEl.querySelector('.prev, .fa-chevron-left');
        }

        return pagination;
    }

    // Utility methods
    extractIdFromUrl(url) {
        const match = url.match(/\/(movie|series|tv|episode)\/([^\/]+)/);
        return match ? match[2] : btoa(url).substring(0, 10);
    }

    extractYear(element) {
        const text = element.textContent;
        const yearMatch = text.match(/(19|20)\d{2}/);
        return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
    }

    extractYearFromText(text) {
        const yearMatch = text.match(/(19|20)\d{2}/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
    }

    extractQuality(element) {
        const text = element.textContent + ' ' + (element.className || '');
        if (text.includes('4K') || text.includes('2160p')) return '4K';
        if (text.includes('1080p') || text.includes('FHD')) return 'FHD';
        if (text.includes('720p') || text.includes('HD')) return 'HD';
        return 'SD';
    }

    extractDescription(element) {
        const descEl = element.querySelector('.description, .synopsis, p');
        return descEl ? descEl.textContent.trim().substring(0, 100) + '...' : '';
    }

    // Cache management
    getFromCache(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const { data, timestamp } = JSON.parse(item);
            if (Date.now() - timestamp > this.cacheDuration) {
                localStorage.removeItem(key);
                return null;
            }
            
            return data;
        } catch (error) {
            return null;
        }
    }

    saveToCache(key, data, duration = this.cacheDuration) {
        try {
            const item = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(item));
            
            // Schedule cleanup
            setTimeout(() => {
                localStorage.removeItem(key);
            }, duration);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    getFallbackData() {
        // Return some fallback data if scraping fails
        return {
            sections: [
                {
                    title: 'الأفلام',
                    type: 'movies',
                    items: [
                        { id: '1', title: 'فيلم تجريبي 1', type: 'movie', url: '#' },
                        { id: '2', title: 'فيلم تجريبي 2', type: 'movie', url: '#' }
                    ]
                }
            ]
        };
    }
}

// Create global instance
window.akwamScraper = new AkwamScraper();
