// Search Results Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
        // Display search query
        document.getElementById('searchQuery').textContent = `نتائج البحث عن: "${query}"`;
        
        // Simulate search results (in real site, this would come from API)
        displaySearchResults(query);
    } else {
        // No search query, redirect to home
        window.location.href = 'index.html';
    }
});

function displaySearchResults(query) {
    // Sample search results data
    const sampleResults = [
        {
            id: 1,
            title: 'فيلم الأكشن الأول',
            type: 'movie',
            year: 2024,
            rating: 8.5,
            quality: 'HD',
            image: 'https://via.placeholder.com/300x450/CCCCCC/333333?text=فيلم+1'
        },
        {
            id: 2,
            title: 'المسلسل الدرامي',
            type: 'series',
            year: 2024,
            rating: 9.2,
            quality: 'FHD',
            episodes: 24,
            image: 'https://via.placeholder.com/300x450/CCCCCC/333333?text=مسلسل+1'
        },
        {
            id: 3,
            title: 'فيلم الكوميديا',
            type: 'movie',
            year: 2023,
            rating: 7.8,
            quality: 'HD',
            image: 'https://via.placeholder.com/300x450/CCCCCC/333333?text=فيلم+2'
        },
        {
            id: 4,
            title: 'مسلسل الأنمي',
            type: 'anime',
            year: 2024,
            rating: 9.5,
            quality: 'HD',
            episodes: 12,
            image: 'https://via.placeholder.com/300x450/CCCCCC/333333?text=أنمي+1'
        },
        {
            id: 5,
            title: 'البرنامج الوثائقي',
            type: 'show',
            year: 2024,
            rating: 8.0,
            quality: 'HD',
            episodes: 10,
            image: 'https://via.placeholder.com/300x450/CCCCCC/333333?text=وثائقي+1'
        },
        {
            id: 6,
            title: 'فيلم التشويق',
            type: 'movie',
            year: 2024,
            rating: 8.7,
            quality: '4K',
            image: 'https://via.placeholder.com/300x450/CCCCCC/333333?text=فيلم+3'
        }
    ];
    
    // Filter results based on query (simple simulation)
    const filteredResults = sampleResults.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
    );
    
    const resultsGrid = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsCount.textContent = filteredResults.length;
    
    if (filteredResults.length === 0) {
        resultsGrid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-search" style="font-size: 60px; color: var(--primary-color); margin-bottom: 20px;"></i>
                <h3>لم يتم العثور على نتائج لـ "${query}"</h3>
                <p>حاول البحث بكلمات مختلفة أو تصفح الأقسام</p>
                <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <a href="movies.html" class="btn btn-primary">
                        <i class="fas fa-film"></i> تصفح الأفلام
                    </a>
                    <a href="series.html" class="btn btn-secondary">
                        <i class="fas fa-tv"></i> تصفح المسلسلات
                    </a>
                    <a href="index.html" class="btn btn-secondary">
                        <i class="fas fa-home"></i> العودة للرئيسية
                    </a>
                </div>
            </div>
        `;
    } else {
        let resultsHTML = '';
        
        filteredResults.forEach(item => {
            const typeText = item.type === 'movie' ? 'فيلم' :
                           item.type === 'series' ? 'مسلسل' :
                           item.type === 'anime' ? 'أنمي' : 'عرض';
            
            resultsHTML += `
                <div class="movie-card">
                    <a href="watch.html?id=${item.id}&type=${item.type}">
                        <div class="movie-poster">
                            <img src="${item.image}" alt="${item.title}">
                            <div class="movie-overlay">
                                <i class="fas fa-play"></i>
                            </div>
                            <span class="movie-quality">${item.quality}</span>
                            ${item.episodes ? `<span class="movie-episodes">${item.episodes} حلقة</span>` : ''}
                        </div>
                        <div class="movie-info">
                            <h3 class="movie-title">${item.title}</h3>
                            <div class="movie-meta">
                                <span class="movie-type">${typeText}</span>
                                <span>${item.year}</span>
                                <span><i class="fas fa-star"></i> ${item.rating}</span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
        
        resultsGrid.innerHTML = resultsHTML;
    }
}

// Handle search from search page
function search() {
    const query = document.getElementById('searchInput').value.trim();
    if (query !== '') {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
}

// Enter key search
document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        search();
    }
});