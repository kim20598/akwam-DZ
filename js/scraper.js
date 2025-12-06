// js/scraper.js
const akwamScraper = {
    mainUrl: "https://akwam.cam",
    timeout: 30000,
    
    // ----------------------------
    // وظائف المساعدة
    // ----------------------------
    getPoster(element) {
        if (!element) return null;
        const img = element.querySelector('img');
        if (!img) return null;
        
        return img.getAttribute('data-src') || 
               img.getAttribute('src') || 
               img.getAttribute('data-lazy-src');
    },

    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        ...options.headers
                    },
                    signal: AbortSignal.timeout(this.timeout)
                });
                
                if (response.ok) {
                    const text = await response.text();
                    return text;
                }
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        throw new Error('فشل في جلب البيانات');
    },

    async getDocument(url) {
        try {
            const html = await this.fetchWithRetry(url);
            const parser = new DOMParser();
            return parser.parseFromString(html, 'text/html');
        } catch (error) {
            console.error('خطأ في تحليل الصفحة:', error);
            return null;
        }
    },

    // ----------------------------
    // وظائف السحب الرئيسية
    // ----------------------------
    parseMediaItems(doc) {
        const items = [];
        
        // محاولة عدة أنماط للعناصر (حسب تغييرات الموقع)
        const selectors = [
            'div.col-lg-auto.col-md-4.col-6',  // النمط القديم
            'div.col-lg-3.col-md-4.col-6',     // نمط جديد
            'div.movie-item',                   // نمط البطاقات
            'div.item',                         // نمط عام
            'article.post'                      // نمط المقالات
        ];

        let elements = [];
        for (const selector of selectors) {
            elements = doc.querySelectorAll(selector);
            if (elements.length > 0) break;
        }

        elements.forEach(el => {
            try {
                // العثور على الرابط
                const link = el.querySelector('a');
                if (!link) return;
                
                const href = link.getAttribute('href');
                if (!href) return;
                
                // العثور على العنوان
                let title = '';
                const titleSelectors = [
                    'h3.entry-title',
                    'h2.title',
                    '.movie-title',
                    '.title',
                    'h3',
                    'h2'
                ];
                
                for (const selector of titleSelectors) {
                    const titleEl = el.querySelector(selector);
                    if (titleEl) {
                        title = titleEl.textContent.trim();
                        break;
                    }
                }
                
                if (!title) return;
                
                // العثور على البوستر
                const poster = this.getPoster(el);
                
                // العثور على الجودة
                let quality = '';
                const qualitySelectors = [
                    '.movie-quality',
                    '.quality',
                    '.label',
                    'span.badge'
                ];
                
                for (const selector of qualitySelectors) {
                    const qualityEl = el.querySelector(selector);
                    if (qualityEl) {
                        quality = qualityEl.textContent.trim();
                        break;
                    }
                }
                
                // العثور على السنة
                let year = '';
                const yearSelectors = [
                    '.movie-year',
                    '.year',
                    'span:contains("20")'
                ];
                
                for (const selector of yearSelectors) {
                    const yearEl = el.querySelector(selector);
                    if (yearEl) {
                        const yearText = yearEl.textContent.trim();
                        const yearMatch = yearText.match(/\b(19|20)\d{2}\b/);
                        if (yearMatch) {
                            year = yearMatch[0];
                            break;
                        }
                    }
                }
                
                // تحديد النوع بناءً على الرابط
                let type = 'movie';
                const urlLower = href.toLowerCase();
                if (urlLower.includes('/series/') || urlLower.includes('/season/')) {
                    type = 'series';
                } else if (urlLower.includes('/anime/')) {
                    type = 'anime';
                } else if (urlLower.includes('/show/')) {
                    type = 'show';
                }
                
                items.push({
                    title,
                    url: href.startsWith('http') ? href : `${this.mainUrl}${href}`,
                    poster: poster ? (poster.startsWith('http') ? poster : `${this.mainUrl}${poster}`) : null,
                    quality,
                    year,
                    type
                });
            } catch (error) {
                console.error('خطأ في تحليل العنصر:', error);
            }
        });

        return items;
    },

    // ----------------------------
    // واجهات API الرئيسية
    // ----------------------------
    async fetchHomePage() {
        try {
            const sections = [];
            
            // قائمة الأقسام الرئيسية
            const mainSections = [
                { url: `${this.mainUrl}/movies`, title: '🎬 أحدث الأفلام', type: 'movies' },
                { url: `${this.mainUrl}/series`, title: '📺 أحدث المسلسلات', type: 'series' },
                { url: `${this.mainUrl}/anime`, title: '👻 أحدث الأنمي', type: 'anime' },
                { url: `${this.mainUrl}/shows`, title: '📡 العروض والبرامج', type: 'shows' }
            ];
            
            for (const section of mainSections) {
                try {
                    const doc = await this.getDocument(section.url);
                    if (!doc) continue;
                    
                    const items = this.parseMediaItems(doc);
                    if (items.length > 0) {
                        sections.push({
                            title: section.title,
                            type: section.type,
                            items: items.slice(0, 12) // عرض 12 عنصر كحد أقصى
                        });
                    }
                } catch (error) {
                    console.error(`خطأ في قسم ${section.title}:`, error);
                }
            }
            
            // إذا فشلت جميع الأقسام، استخدم بيانات تجريبية
            if (sections.length === 0) {
                return this.getFallbackData();
            }
            
            return { sections, success: true, timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('خطأ في جلب الصفحة الرئيسية:', error);
            return this.getFallbackData();
        }
    },

    async search(query, page = 1) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const searchUrl = `${this.mainUrl}/search?q=${encodedQuery}&page=${page}`;
            
            const doc = await this.getDocument(searchUrl);
            if (!doc) {
                return { items: [], pagination: { current: page, total: 1 } };
            }
            
            const items = this.parseMediaItems(doc);
            
            // محاولة استخراج معلومات الترقيم
            let totalPages = 1;
            const paginationEls = doc.querySelectorAll('.pagination a, .page-numbers a');
            const pageNumbers = [];
            
            paginationEls.forEach(el => {
                const text = el.textContent.trim();
                const num = parseInt(text);
                if (!isNaN(num)) {
                    pageNumbers.push(num);
                }
            });
            
            if (pageNumbers.length > 0) {
                totalPages = Math.max(...pageNumbers);
            }
            
            return {
                items,
                pagination: {
                    current: page,
                    total: totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('خطأ في البحث:', error);
            return { items: [], pagination: { current: page, total: 1 } };
        }
    },

    async getMediaDetails(url) {
        try {
            const doc = await this.getDocument(url);
            if (!doc) return null;
            
            // استخراج العنوان
            const titleSelectors = [
                'h1.entry-title',
                'h1.title',
                '.movie-title h1',
                'h1'
            ];
            
            let title = '';
            for (const selector of titleSelectors) {
                const titleEl = doc.querySelector(selector);
                if (titleEl) {
                    title = titleEl.textContent.trim();
                    break;
                }
            }
            
            // استخراج الوصف
            let plot = '';
            const plotSelectors = [
                'h2:contains("قصة") + div > p',
                '.description',
                '.plot',
                'meta[name="description"]',
                'meta[property="og:description"]'
            ];
            
            for (const selector of plotSelectors) {
                const plotEl = doc.querySelector(selector);
                if (plotEl) {
                    plot = plotEl.getAttribute('content') || plotEl.textContent;
                    plot = plot.trim();
                    if (plot) break;
                }
            }
            
            // استخراج البوستر
            let poster = '';
            const posterSelectors = [
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
                '.movie-poster img',
                '.poster img',
                'img[src*="poster"]',
                'img[src*="cover"]'
            ];
            
            for (const selector of posterSelectors) {
                const posterEl = doc.querySelector(selector);
                if (posterEl) {
                    poster = posterEl.getAttribute('content') || posterEl.getAttribute('src');
                    if (poster) break;
                }
            }
            
            // استخراج التصنيفات
            const tags = [];
            const tagSelectors = [
                '.tags a',
                '.categories a',
                '.genre a',
                'a[href*="/category/"]',
                'a[href*="/genre/"]'
            ];
            
            tagSelectors.forEach(selector => {
                doc.querySelectorAll(selector).forEach(el => {
                    const tag = el.textContent.trim();
                    if (tag && !tags.includes(tag)) {
                        tags.push(tag);
                    }
                });
            });
            
            // استخراج السنة
            let year = '';
            const yearMatch = url.match(/\/(19|20)\d{2}\//);
            if (yearMatch) {
                year = yearMatch[0].replace(/\//g, '');
            }
            
            // استخراج الحلقات (للمسلسلات)
            const episodes = [];
            const episodeSelectors = [
                '#series-episodes .episode',
                '.episodes-list .episode',
                '.season-episodes .episode'
            ];
            
            episodeSelectors.forEach(selector => {
                doc.querySelectorAll(selector).forEach((ep, index) => {
                    const epLink = ep.querySelector('a');
                    if (epLink) {
                        episodes.push({
                            title: epLink.textContent.trim() || `الحلقة ${index + 1}`,
                            url: epLink.getAttribute('href'),
                            number: index + 1
                        });
                    }
                });
            });
            
            return {
                title,
                plot,
                poster: poster ? (poster.startsWith('http') ? poster : `${this.mainUrl}${poster}`) : null,
                tags,
                year,
                episodes,
                url
            };
        } catch (error) {
            console.error('خطأ في جلب تفاصيل الوسائط:', error);
            return null;
        }
    },

    async getVideoSources(episodeUrl) {
        try {
            const doc = await this.getDocument(episodeUrl);
            if (!doc) return [];
            
            const sources = [];
            
            // البحث عن روابط الفيديو المباشرة
            const videoSelectors = [
                'source[src]',
                'video source[src]',
                'iframe[src*="embed"]',
                'iframe[src*="video"]',
                'div[data-video-src]',
                'a[href*=".mp4"]',
                'a[href*=".m3u8"]'
            ];
            
            videoSelectors.forEach(selector => {
                doc.querySelectorAll(selector).forEach(el => {
                    const src = el.getAttribute('src') || 
                               el.getAttribute('data-video-src') || 
                               el.getAttribute('href');
                    
                    if (src && (src.includes('.mp4') || src.includes('.m3u8') || src.includes('embed'))) {
                        let quality = 'متوسط';
                        const qualityAttr = el.getAttribute('size') || 
                                           el.getAttribute('label') || 
                                           el.getAttribute('data-quality');
                        
                        if (qualityAttr) {
                            quality = qualityAttr;
                        } else if (src.includes('1080')) {
                            quality = 'عالية';
                        } else if (src.includes('720')) {
                            quality = 'متوسط';
                        } else if (src.includes('480')) {
                            quality = 'منخفضة';
                        }
                        
                        sources.push({
                            url: src.startsWith('http') ? src : `${this.mainUrl}${src}`,
                            quality,
                            type: src.includes('.m3u8') ? 'hls' : 'direct'
                        });
                    }
                });
            });
            
            return sources;
        } catch (error) {
            console.error('خطأ في جلب مصادر الفيديو:', error);
            return [];
        }
    },

    // بيانات تجريبية للاستخدام عند فشل الاتصال
    getFallbackData() {
        return {
            sections: [
                {
                    title: '🎬 أفلام تجريبية',
                    type: 'movies',
                    items: [
                        {
                            title: 'فيلم تجريبي 1',
                            url: '#',
                            poster: 'https://via.placeholder.com/300x450/333/666?text=فيلم+تجريبي',
                            quality: 'HD',
                            year: '2024',
                            type: 'movie'
                        },
                        {
                            title: 'فيلم تجريبي 2',
                            url: '#',
                            poster: 'https://via.placeholder.com/300x450/333/666?text=فيلم+تجريبي',
                            quality: 'FHD',
                            year: '2023',
                            type: 'movie'
                        }
                    ]
                }
            ],
            success: false,
            timestamp: new Date().toISOString(),
            isFallback: true
        };
    }
};
