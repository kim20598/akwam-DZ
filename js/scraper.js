// js/scraper.js - استخدام API جاهز
const akwamScraper = {
    // استخدام RapidAPI أو API مشابه
    async fetchViaRapidAPI() {
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': 'your-api-key-here',
                'X-RapidAPI-Host': 'community-web-scraping.p.rapidapi.com'
            }
        };
        
        try {
            const response = await fetch(
                `https://community-web-scraping.p.rapidapi.com/https://ak.sv`, 
                options
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API error:', error);
            return null;
        }
    },
    
    // أو استخدام AllOrigins
    async fetchViaAllOrigins(url) {
        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            return data.contents;
        } catch (error) {
            console.error('AllOrigins error:', error);
            return null;
        }
    },
    
    // الدالة الرئيسية
    async fetchHomePage() {
        console.log('جرب AllOrigins API...');
        
        // جرب AllOrigins أولاً (مجاني)
        const html = await this.fetchViaAllOrigins('https://ak.sv');
        
        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // استخراج البيانات الأساسية
            const items = [];
            
            // ابحث عن أي روابط تحتوي على movie أو series
            const links = doc.querySelectorAll('a[href*="movie"], a[href*="series"], a[href*="anime"]');
            
            links.forEach(link => {
                const title = link.textContent.trim() || link.title || '';
                const href = link.href;
                
                if (title && href && title.length > 3) {
                    const img = link.querySelector('img');
                    const poster = img ? img.src : null;
                    
                    let type = 'movie';
                    if (href.includes('series')) type = 'series';
                    if (href.includes('anime')) type = 'anime';
                    
                    items.push({
                        title: title.substring(0, 50),
                        url: href,
                        poster: poster,
                        type: type
                    });
                }
            });
            
            // إزالة التكرارات
            const uniqueItems = [...new Map(items.map(item => [item.url, item])).values()];
            
            if (uniqueItems.length > 0) {
                return {
                    sections: [{
                        title: 'المحتوى المتاح من ak.sv',
                        type: 'content',
                        items: uniqueItems.slice(0, 12)
                    }],
                    success: true,
                    message: `تم العثور على ${uniqueItems.length} عنصر`
                };
            }
        }
        
        // إذا فشل كل شيء
        return this.getMockData();
    },
    
    // بيانات وهمية احتياطية
    getMockData() {
        // ... نفس البيانات الوهمية السابقة
    }
};
