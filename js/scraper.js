// js/scraper.js
const akwamScraper = {
    mainUrl: "https://ak.sv",
    
    // قائمة CORS Proxies مجانية (اختبر واحدة فقط)
    proxies: [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/',
        'https://corsproxy.io/?',
        'https://proxy.cors.sh/'
    ],
    
    // اختيار Proxy عشوائي
    getRandomProxy() {
        return this.proxies[Math.floor(Math.random() * this.proxies.length)];
    },
    
    // دالة سحب مع Proxy
    async fetchWithProxy(url, options = {}) {
        let lastError = null;
        
        // جرب جميع الـ Proxies
        for (const proxy of this.proxies) {
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                console.log('جرب Proxy:', proxy);
                
                const response = await fetch(proxyUrl, {
                    ...options,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html',
                        ...options.headers
                    },
                    timeout: 10000
                });
                
                if (response.ok) {
                    const text = await response.text();
                    return text;
                }
            } catch (error) {
                lastError = error;
                console.warn(`فشل Proxy ${proxy}:`, error.message);
                continue;
            }
        }
        
        throw lastError || new Error('جميع الـ Proxies فشلت');
    },
    
    // طريقة بديلة: استخدام service خاص (سيحتاج backend)
    async fetchWithBackend(url) {
        try {
            // يمكنك استبدال هذا بـ backend حقيقي
            const backendUrl = 'https://your-backend.com/proxy'; // تحتاج لإنشاء هذا
            
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('خطأ في Backend:', error);
            throw error;
        }
    },
    
    // سحب الصفحة الرئيسية مع Proxy
    async fetchHomePage() {
        try {
            console.log('محاولة سحب البيانات من ak.sv...');
            
            const html = await this.fetchWithProxy(this.mainUrl);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // محاولة استخراج البيانات
            const sections = [];
            
            // 1. البحث عن الأقسام الرئيسية
            const sectionSelectors = [
                { selector: 'section:has(h2)', type: 'section' },
                { selector: '.container .row', type: 'row' },
                { selector: 'div[class*="movies"]', type: 'movies' },
                { selector: 'div[class*="series"]', type: 'series' }
            ];
            
            for (const { selector, type } of sectionSelectors) {
                const elements = doc.querySelectorAll(selector);
                
                elements.forEach((section, index) => {
                    const titleEl = section.querySelector('h2, h3, .title');
                    const title = titleEl ? titleEl.textContent.trim() : `قسم ${index + 1}`;
                    
                    // استخراج العناصر داخل القسم
                    const items = this.extractItemsFromSection(section);
                    
                    if (items.length > 0) {
                        sections.push({
                            title: title,
                            type: type,
                            items: items.slice(0, 6)
                        });
                    }
                });
            }
            
            // 2. إذا لم نجد أقسام، نبحث عن جميع العناصر
            if (sections.length === 0) {
                console.log('البحث عن جميع العناصر...');
                const allItems = this.extractAllItems(doc);
                
                if (allItems.length > 0) {
                    sections.push({
                        title: 'المحتوى المتاح',
                        type: 'all',
                        items: allItems.slice(0, 12)
                    });
                }
            }
            
            // 3. إذا لم نجد أي شيء
            if (sections.length === 0) {
                console.log('لم يتم العثور على بيانات، استخدام بيانات وهمية');
                return this.getMockData();
            }
            
            return {
                sections: sections,
                success: true,
                message: `تم العثور على ${sections.length} قسم`,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('خطأ في سحب البيانات:', error);
            return this.getMockData();
        }
    },
    
    // استخراج العناصر من قسم معين
    extractItemsFromSection(section) {
        const items = [];
        
        // محاولة عدة أنماط للعناصر
        const itemSelectors = [
            'a[href*="/movie/"]',
            'a[href*="/series/"]',
            'a[href*="/anime/"]',
            'a[href*="/show/"]',
            '.post',
            '.item',
            '.card',
            'article',
            'div[class*="col-"]'
        ];
        
        itemSelectors.forEach(selector => {
            section.querySelectorAll(selector).forEach(element => {
                const item = this.extractItemData(element);
                if (item && item.title) {
                    items.push(item);
                }
            });
        });
        
        return items;
    },
    
    // استخراج جميع العناصر من الصفحة
    extractAllItems(doc) {
        const items = [];
        
        // البحث عن جميع الروابط المحتملة
        const links = doc.querySelectorAll('a[href*="/movie/"], a[href*="/series/"], a[href*="/anime/"], a[href*="/show/"]');
        
        links.forEach(link => {
            try {
                const title = link.textContent.trim() || 
                              link.getAttribute('title') || 
                              link.getAttribute('alt') ||
                              link.querySelector('img')?.getAttribute('alt') ||
                              '';
                
                if (title && title.length > 2) { // تأكد أن العنوان ليس فارغاً
                    const href = link.getAttribute('href');
                    const fullUrl = href.startsWith('http') ? href : this.mainUrl + href;
                    
                    // استخراج الصورة
                    let image = null;
                    const img = link.querySelector('img');
                    if (img) {
                        image = img.getAttribute('src') || 
                                img.getAttribute('data-src') ||
                                img.getAttribute('data-lazy-src');
                        
                        if (image && !image.startsWith('http')) {
                            image = this.mainUrl + image;
                        }
                    }
                    
                    // تحديد النوع
                    let type = 'movie';
                    if (href.includes('/series/')) type = 'series';
                    if (href.includes('/anime/')) type = 'anime';
                    if (href.includes('/show/')) type = 'show';
                    
                    items.push({
                        title: title,
                        url: fullUrl,
                        poster: image,
                        type: type
                    });
                }
            } catch (error) {
                console.warn('خطأ في استخراج عنصر:', error);
            }
        });
        
        // إزالة التكرارات
        return this.removeDuplicates(items);
    },
    
    // إزالة العناصر المكررة
    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = item.url + item.title;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },
    
    // استخراج بيانات عنصر واحد
    extractItemData(element) {
        try {
            // العثور على الرابط
            let link = element;
            if (element.tagName !== 'A') {
                link = element.querySelector('a');
            }
            
            if (!link) return null;
            
            const href = link.getAttribute('href');
            if (!href) return null;
            
            // العثور على العنوان
            let title = '';
            const titleSelectors = [
                'h3', 'h2', '.title', '.entry-title', 
                '.movie-title', '.series-title'
            ];
            
            for (const selector of titleSelectors) {
                const titleEl = element.querySelector(selector) || link.querySelector(selector);
                if (titleEl) {
                    title = titleEl.textContent.trim();
                    if (title) break;
                }
            }
            
            if (!title) {
                title = link.textContent.trim() || 
                        link.getAttribute('title') || 
                        link.getAttribute('alt') || '';
            }
            
            if (!title || title.length < 2) return null;
            
            // العثور على الصورة
            let image = null;
            const imgSelectors = ['img', '.poster', '.thumbnail'];
            
            for (const selector of imgSelectors) {
                const img = element.querySelector(selector) || link.querySelector(selector);
                if (img) {
                    image = img.getAttribute('src') || 
                            img.getAttribute('data-src') ||
                            img.getAttribute('data-lazy-src');
                    if (image) break;
                }
            }
            
            // إضافة النطاق الأساسي إذا كانت الصورة نسبية
            if (image && !image.startsWith('http')) {
                image = this.mainUrl + image;
            }
            
            // تحديد النوع
            let type = 'movie';
            if (href.includes('/series/')) type = 'series';
            if (href.includes('/anime/')) type = 'anime';
            if (href.includes('/show/')) type = 'show';
            
            return {
                title: title,
                url: href.startsWith('http') ? href : this.mainUrl + href,
                poster: image,
                type: type
            };
            
        } catch (error) {
            console.warn('خطأ في استخراج بيانات العنصر:', error);
            return null;
        }
    },
    
    // البحث
    async search(query) {
        try {
            const searchUrl = `${this.mainUrl}/search?q=${encodeURIComponent(query)}`;
            const html = await this.fetchWithProxy(searchUrl);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const items = this.extractAllItems(doc);
            
            return {
                items: items.slice(0, 20),
                query: query,
                count: items.length,
                success: true
            };
            
        } catch (error) {
            console.error('خطأ في البحث:', error);
            return {
                items: [],
                query: query,
                count: 0,
                success: false,
                error: error.message
            };
        }
    },
    
    // بيانات وهمية للاستخدام عند فشل السحب
    getMockData() {
        console.log('استخدام بيانات وهمية...');
        
        return {
            sections: [
                {
                    title: "أفلام أكشن",
                    type: "movies",
                    items: [
                        {
                            title: "فيلم أكشن 2024",
                            url: "#",
                            poster: "https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=فيلم+أكشن",
                            type: "movie",
                            quality: "HD",
                            year: "2024"
                        },
                        {
                            title: "فيلم تشويق",
                            url: "#",
                            poster: "https://via.placeholder.com/300x450/4ECDC4/FFFFFF?text=فيلم+تشويق",
                            type: "movie",
                            quality: "FHD",
                            year: "2023"
                        }
                    ]
                },
                {
                    title: "مسلسلات دراما",
                    type: "series",
                    items: [
                        {
                            title: "مسلسل درامي 2024",
                            url: "#",
                            poster: "https://via.placeholder.com/300x450/FFE66D/333333?text=مسلسل+دراما",
                            type: "series",
                            episodes: "30 حلقة",
                            year: "2024"
                        },
                        {
                            title: "مسلسل تاريخي",
                            url: "#",
                            poster: "https://via.placeholder.com/300x450/95E1D3/333333?text=مسلسل+تاريخي",
                            type: "series",
                            episodes: "45 حلقة",
                            year: "2023"
                        }
                    ]
                }
            ],
            success: false,
            isMock: true,
            message: "بيانات وهمية - فشل الاتصال بالموقع",
            timestamp: new Date().toISOString()
        };
    }
};
