// js/main.js
// وظائف عامة للموقع

// تبديل القائمة على الأجهزة المحمولة
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    if (navMenu && mobileToggle) {
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('active');
        
        // تغيير الأيقونة
        const icon = mobileToggle.querySelector('i');
        if (icon) {
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
}

// إغلاق القائمة عند النقر خارجها
document.addEventListener('click', function(event) {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    if (navMenu && mobileToggle && 
        !navMenu.contains(event.target) && 
        !mobileToggle.contains(event.target) &&
        navMenu.classList.contains('active')) {
        toggleMenu();
    }
});

// إغلاق القائمة عند تغيير حجم النافذة
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const mobileToggle = document.querySelector('.mobile-toggle');
            if (mobileToggle) {
                mobileToggle.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        }
    }
});

// إضافة تأثير التمرير السلس
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// إضافة تأثير عند التمرير للشريط العلوي
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// تهيئة الموقع عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // تحديث سنة حقوق النشر تلقائياً
    const copyrightElements = document.querySelectorAll('.footer-bottom p');
    copyrightElements.forEach(element => {
        element.innerHTML = element.innerHTML.replace('2024', new Date().getFullYear());
    });
    
    // إضافة تأثيرات للبطاقات
    const movieCards = document.querySelectorAll('.movie-card');
    movieCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
    });
});

// وظائف مشتركة للموقع
const AkwamUtils = {
    // تنقية النصوص من HTML
    sanitizeText(text) {
        if (!text) return '';
        return text
            .replace(/<\/?[^>]+(>|$)/g, '') // إزالة وسوم HTML
            .replace(/&nbsp;/g, ' ')        // إزالة المسافات غير القابلة للكسر
            .replace(/&amp;/g, '&')         // استبدال &
            .replace(/&quot;/g, '"')        // استبدال "
            .replace(/&#39;/g, "'")         // استبدال '
            .trim();
    },

    // تقطيع النص وإضافة ...
    truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // تنسيق التاريخ
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // تحميل الصور مع التعامل مع الأخطاء
    loadImage(imgElement, src, fallbackSrc = null) {
        if (!imgElement) return;
        
        imgElement.onerror = function() {
            if (fallbackSrc) {
                this.src = fallbackSrc;
            } else {
                // إنشاء صورة تجريبية باستخدام Placeholder
                const title = this.alt || 'صورة';
                const encodedTitle = encodeURIComponent(title);
                this.src = `https://via.placeholder.com/300x450/333/666?text=${encodedTitle}`;
            }
            this.onerror = null; // منع حلقات الخطأ
        };
        
        imgElement.src = src;
    },

    // إنشاء عنصر بطاقة
    createMovieCard(item) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const title = this.sanitizeText(item.title);
        const truncatedTitle = this.truncateText(title, 30);
        
        card.innerHTML = `
            <a href="watch.html?url=${encodeURIComponent(item.url)}&type=${item.type}" 
               onclick="previewContent(event, '${item.url}', '${item.type}')">
                <div class="movie-poster">
                    ${item.poster ? 
                        `<img src="${item.poster}" alt="${title}" 
                              onerror="this.src='https://via.placeholder.com/300x450/333/666?text=${encodeURIComponent(title.substring(0, 20))}'">` :
                        `<div class="no-poster">${title.substring(0, 20)}</div>`
                    }
                    <div class="movie-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                    ${item.quality ? `<span class="movie-quality">${item.quality}</span>` : ''}
                    ${item.year ? `<span class="movie-year">${item.year}</span>` : ''}
                </div>
                <div class="movie-info">
                    <h3 class="movie-title" title="${title}">
                        ${truncatedTitle}
                    </h3>
                    <div class="movie-meta">
                        <span class="movie-type">${this.getTypeArabic(item.type)}</span>
                        ${item.year ? `<span>${item.year}</span>` : ''}
                    </div>
                </div>
            </a>
        `;
        
        return card;
    },

    // ترجمة النوع إلى العربية
    getTypeArabic(type) {
        const types = {
            'movie': 'فيلم',
            'series': 'مسلسل',
            'anime': 'أنمي',
            'show': 'عرض',
            'tv': 'تلفزيوني',
            'documentary': 'وثائقي',
            'featured': 'مميز'
        };
        return types[type] || type;
    },

    // إظهار إشعار
    showNotification(message, type = 'info') {
        // إزالة الإشعارات القديمة
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // إزالة الإشعار بعد 5 ثوانٍ
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },

    // إظهار مؤشر التحميل
    showLoader(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>جاري التحميل...</p>
                </div>
            `;
        }
    },

    // إخفاء مؤشر التحميل
    hideLoader(containerId, content = '') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = content;
        }
    }
};

// جعل الأداة المساعدة متاحة عالمياً
window.AkwamUtils = AkwamUtils;
