// Main JavaScript for Akwam Website

// Mobile Menu Toggle
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
    
    // Toggle search box on mobile
    if (window.innerWidth <= 992) {
        const searchBox = document.querySelector('.search-box');
        if (navMenu.classList.contains('active')) {
            searchBox.classList.remove('active');
        }
    }
}

// Search Box Toggle on Mobile
function toggleSearch() {
    if (window.innerWidth <= 992) {
        const searchBox = document.querySelector('.search-box');
        const navMenu = document.querySelector('.nav-menu');
        
        searchBox.classList.toggle('active');
        if (searchBox.classList.contains('active')) {
            navMenu.classList.remove('active');
            document.querySelector('.mobile-toggle').classList.remove('active');
        }
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target)) {
            const content = dropdown.querySelector('.dropdown-content');
            if (content) {
                content.style.display = 'none';
            }
        }
    });
});

// Handle dropdown clicks
document.querySelectorAll('.dropdown > a').forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            e.preventDefault();
            const content = this.nextElementSibling;
            const isActive = content.style.display === 'block';
            
            // Close all dropdowns
            document.querySelectorAll('.dropdown-content').forEach(item => {
                item.style.display = 'none';
            });
            
            // Toggle current dropdown
            content.style.display = isActive ? 'none' : 'block';
            
            // Toggle active class on parent
            this.parentElement.classList.toggle('active');
        }
    });
});

// Simple Search Function
function search() {
    const query = document.getElementById('searchInput').value.trim();
    if (query !== '') {
        // In a real site, this would redirect to search results
        alert(`البحث عن: ${query}`);
        // window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
}

// Handle Enter key in search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                search();
            }
        });
    }
});

// Movie Card Hover Effects
document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.zIndex = '1';
    });
});

// Add to Favorites
function addToFavorites(movieId) {
    let favorites = JSON.parse(localStorage.getItem('akwam_favorites') || '[]');
    
    if (!favorites.includes(movieId)) {
        favorites.push(movieId);
        localStorage.setItem('akwam_favorites', JSON.stringify(favorites));
        showNotification('تمت الإضافة إلى المفضلة', 'success');
        return true;
    } else {
        favorites = favorites.filter(id => id !== movieId);
        localStorage.setItem('akwam_favorites', JSON.stringify(favorites));
        showNotification('تمت الإزالة من المفضلة', 'info');
        return false;
    }
}

// Check if movie is in favorites
function isFavorite(movieId) {
    const favorites = JSON.parse(localStorage.getItem('akwam_favorites') || '[]');
    return favorites.includes(movieId);
}

// Watch History
function addToHistory(movieId, title) {
    let history = JSON.parse(localStorage.getItem('akwam_history') || '[]');
    
    // Remove if already exists
    history = history.filter(item => item.id !== movieId);
    
    // Add to beginning
    history.unshift({
        id: movieId,
        title: title,
        timestamp: Date.now()
    });
    
    // Keep only last 50 items
    history = history.slice(0, 50);
    
    localStorage.setItem('akwam_history', JSON.stringify(history));
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s;
    `;
    
    // Style based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#46d369';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e50914';
    } else {
        notification.style.backgroundColor = '#2196F3';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Theme Switcher (Light/Dark)
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'light') {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('akwam_theme', 'dark');
        showNotification('تم التغيير إلى الوضع الداكن', 'info');
    } else {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('akwam_theme', 'light');
        showNotification('تم التغيير إلى الوضع الفاتح', 'info');
    }
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('akwam_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Don't trigger shortcuts when user is typing
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Esc to close mobile menu
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
            toggleMenu();
        }
    }
    
    // Ctrl/Cmd + T to toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        toggleTheme();
    }
});

// Lazy Load Images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load theme
    loadTheme();
    
    // Initialize lazy loading
    lazyLoadImages();
    
    // Close mobile menu when clicking on link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                toggleMenu();
            }
        });
    });
    
    // Add theme toggle button to footer
    const themeToggle = document.createElement('button');
    themeToggle.className = 'btn btn-secondary';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> تغيير الثيم';
    themeToggle.onclick = toggleTheme;
    themeToggle.style.marginTop = '20px';
    
    const footerSection = document.querySelector('.footer-section:first-child');
    if (footerSection) {
        footerSection.appendChild(themeToggle);
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    if (window.innerWidth > 992) {
        navMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
        navMenu.style.display = 'flex';
    } else {
        navMenu.style.display = 'none';
    }
});

// Simple Error Handler
function handleError(error) {
    console.error('Error:', error);
    showNotification('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
}

// Format Date
function formatDate(date) {
    return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other files
window.Akwam = {
    toggleMenu,
    search,
    addToFavorites,
    isFavorite,
    addToHistory,
    showNotification,
    toggleTheme,
    handleError,
    formatDate
};