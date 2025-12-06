// Video Player JavaScript

class VideoPlayer {
    constructor() {
        this.player = null;
        this.currentEpisode = 1;
        this.totalEpisodes = 24;
        this.isFavorite = false;
        this.watchedEpisodes = new Set();
        this.currentQuality = '720p';
        
        this.initializePlayer();
        this.bindEvents();
        this.loadWatchedEpisodes();
    }
    
    initializePlayer() {
        this.player = document.getElementById('videoPlayer');
        
        if (!this.player) return;
        
        // Set player properties
        this.player.volume = 0.7;
        this.player.playbackRate = 1.0;
        
        // Check if video is in favorites
        this.checkFavorite();
        
        // Set up episode selector if this is a series
        this.setupEpisodeSelector();
        
        // Set up quality selector
        this.setupQualitySelector();
    }
    
    bindEvents() {
        if (!this.player) return;
        
        // Track time for resume functionality
        this.player.addEventListener('timeupdate', () => {
            this.saveProgress();
        });
        
        // Auto-play next episode
        this.player.addEventListener('ended', () => {
            this.autoPlayNext();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    setupEpisodeSelector() {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type === 'series' || type === 'anime' || type === 'show') {
            const episodeSelector = document.getElementById('episodeSelector');
            if (episodeSelector) {
                episodeSelector.style.display = 'block';
                this.generateEpisodeButtons();
            }
        }
    }
    
    generateEpisodeButtons() {
        const episodesGrid = document.getElementById('episodesGrid');
        if (!episodesGrid) return;
        
        let buttonsHTML = '';
        
        for (let i = 1; i <= this.totalEpisodes; i++) {
            const isWatched = this.watchedEpisodes.has(i);
            const isActive = i === this.currentEpisode;
            
            buttonsHTML += `
                <button class="episode-btn ${isActive ? 'active' : ''} ${isWatched ? 'watched' : ''}"
                        onclick="videoPlayer.playEpisode(${i})"
                        title="الحلقة ${i}">
                    ${i}
                </button>
            `;
        }
        
        episodesGrid.innerHTML = buttonsHTML;
    }
    
    setupQualitySelector() {
        const qualityButtons = document.querySelectorAll('.quality-btn');
        if (!qualityButtons.length) return;
        
        qualityButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.changeQuality(e.target.textContent);
            });
        });
    }
    
    playEpisode(episodeNumber) {
        this.currentEpisode = episodeNumber;
        
        // Mark as watched
        this.watchedEpisodes.add(episodeNumber);
        this.saveWatchedEpisodes();
        
        // Update UI
        this.updateEpisodeUI();
        
        // Change video title
        const videoTitle = document.getElementById('videoTitle');
        if (videoTitle) {
            const baseTitle = videoTitle.textContent.split(' - ')[0];
            videoTitle.textContent = `${baseTitle} - الحلقة ${episodeNumber}`;
        }
        
        // Update URL without reloading
        const url = new URL(window.location);
        url.searchParams.set('episode', episodeNumber);
        window.history.replaceState({}, '', url);
        
        // Show notification
        this.showNotification(`تشغيل الحلقة ${episodeNumber}`);
        
        // In a real site, you would change the video source here
        // For demo, we'll just restart the current video
        if (this.player) {
            this.player.currentTime = 0;
            this.player.play();
        }
    }
    
    updateEpisodeUI() {
        const episodeButtons = document.querySelectorAll('.episode-btn');
        episodeButtons.forEach(button => {
            const episodeNum = parseInt(button.textContent);
            button.classList.remove('active');
            button.classList.toggle('watched', this.watchedEpisodes.has(episodeNum));
            
            if (episodeNum === this.currentEpisode) {
                button.classList.add('active');
            }
        });
    }
    
    changeQuality(quality) {
        this.currentQuality = quality;
        
        // Update active button
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === quality) {
                btn.classList.add('active');
            }
        });
        
        // Show notification
        this.showNotification(`تم تغيير الجودة إلى ${quality}`);
        
        // In a real site, you would change the video source here
    }
    
    playNextEpisode() {
        if (this.currentEpisode < this.totalEpisodes) {
            this.playEpisode(this.currentEpisode + 1);
        } else {
            this.showNotification('هذه آخر حلقة', 'info');
        }
    }
    
    playPreviousEpisode() {
        if (this.currentEpisode > 1) {
            this.playEpisode(this.currentEpisode - 1);
        } else {
            this.showNotification('هذه أول حلقة', 'info');
        }
    }
    
    autoPlayNext() {
        // Check if autoplay is enabled
        const autoplay = localStorage.getItem('akwam_autoplay') !== 'false';
        
        if (autoplay) {
            setTimeout(() => {
                this.playNextEpisode();
            }, 3000);
        }
    }
    
    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
        
        const btn = document.getElementById('favoriteBtn');
        const icon = btn.querySelector('i');
        
        if (this.isFavorite) {
            btn.classList.add('active');
            icon.className = 'fas fa-heart';
            btn.innerHTML = '<i class="fas fa-heart"></i> إزالة من المفضلة';
            this.showNotification('تمت الإضافة إلى المفضلة', 'success');
        } else {
            btn.classList.remove('active');
            icon.className = 'far fa-heart';
            btn.innerHTML = '<i class="far fa-heart"></i> إضافة للمفضلة';
            this.showNotification('تمت الإزالة من المفضلة', 'info');
        }
        
        // Save to localStorage
        this.saveFavorite();
    }
    
    checkFavorite() {
        const videoId = this.getVideoId();
        const favorites = JSON.parse(localStorage.getItem('akwam_favorites') || '[]');
        this.isFavorite = favorites.includes(videoId);
        
        const btn = document.getElementById('favoriteBtn');
        if (btn) {
            const icon = btn.querySelector('i');
            if (this.isFavorite) {
                btn.classList.add('active');
                icon.className = 'fas fa-heart';
                btn.innerHTML = '<i class="fas fa-heart"></i> إزالة من المفضلة';
            }
        }
    }
    
    saveFavorite() {
        const videoId = this.getVideoId();
        let favorites = JSON.parse(localStorage.getItem('akwam_favorites') || '[]');
        
        if (this.isFavorite) {
            if (!favorites.includes(videoId)) {
                favorites.push(videoId);
            }
        } else {
            favorites = favorites.filter(id => id !== videoId);
        }
        
        localStorage.setItem('akwam_favorites', JSON.stringify(favorites));
    }
    
    saveProgress() {
        if (!this.player) return;
        
        const videoId = this.getVideoId();
        const progress = {
            time: this.player.currentTime,
            episode: this.currentEpisode,
            timestamp: Date.now()
        };
        
        localStorage.setItem(`progress_${videoId}`, JSON.stringify(progress));
    }
    
    loadProgress() {
        const videoId = this.getVideoId();
        const savedProgress = localStorage.getItem(`progress_${videoId}`);
        
        if (savedProgress && this.player) {
            try {
                const progress = JSON.parse(savedProgress);
                
                // Check if progress is not too old (7 days)
                if (Date.now() - progress.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    this.player.currentTime = progress.time || 0;
                    
                    // If this is a series, load the episode
                    if (progress.episode && progress.episode !== this.currentEpisode) {
                        this.playEpisode(progress.episode);
                    }
                    
                    this.showNotification('تم استئناف المشاهدة من آخر نقطة', 'info');
                }
            } catch (e) {
                console.error('Error loading progress:', e);
            }
        }
    }
    
    saveWatchedEpisodes() {
        const videoId = this.getVideoId();
        const watched = Array.from(this.watchedEpisodes);
        localStorage.setItem(`watched_${videoId}`, JSON.stringify(watched));
    }
    
    loadWatchedEpisodes() {
        const videoId = this.getVideoId();
        const savedWatched = localStorage.getItem(`watched_${videoId}`);
        
        if (savedWatched) {
            try {
                const watched = JSON.parse(savedWatched);
                this.watchedEpisodes = new Set(watched);
            } catch (e) {
                console.error('Error loading watched episodes:', e);
            }
        }
    }
    
    getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || 'unknown';
    }
    
    handleKeyboardShortcuts(e) {
        // Don't trigger when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        if (!this.player) return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.player.paused ? this.player.play() : this.player.pause();
                break;
                
            case 'f':
                e.preventDefault();
                if (this.player.requestFullscreen) {
                    this.player.requestFullscreen();
                }
                break;
                
            case 'm':
                e.preventDefault();
                this.player.muted = !this.player.muted;
                break;
                
            case 'arrowright':
                e.preventDefault();
                this.player.currentTime += 10;
                break;
                
            case 'arrowleft':
                e.preventDefault();
                this.player.currentTime -= 10;
                break;
                
            case 'arrowup':
                e.preventDefault();
                this.player.volume = Math.min(1, this.player.volume + 0.1);
                break;
                
            case 'arrowdown':
                e.preventDefault();
                this.player.volume = Math.max(0, this.player.volume - 0.1);
                break;
                
            case 'n':
                e.preventDefault();
                this.playNextEpisode();
                break;
                
            case 'p':
                e.preventDefault();
                this.playPreviousEpisode();
                break;
                
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const percentage = parseInt(e.key) / 10;
                    this.player.currentTime = this.player.duration * percentage;
                }
                break;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `player-notification player-notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s;
            max-width: 300px;
            text-align: center;
        `;
        
        // Style based on type
        if (type === 'success') {
            notification.style.backgroundColor = '#46d369';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#e50914';
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#ff9800';
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
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    downloadVideo() {
        this.showNotification('جاري إعداد التحميل...', 'info');
        
        // In a real site, this would trigger a download
        setTimeout(() => {
            this.showNotification('بدأ التحميل، يرجى الانتظار', 'success');
        }, 1000);
    }
    
    shareVideo() {
        const title = document.getElementById('videoTitle')?.textContent || 'مشاهدة على أكوام';
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: 'شاهد هذا المحتوى على أكوام',
                url: url
            }).then(() => {
                this.showNotification('تمت المشاركة بنجاح', 'success');
            }).catch(() => {
                this.copyToClipboard(url);
            });
        } else {
            this.copyToClipboard(url);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('تم نسخ الرابط', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('تم نسخ الرابط', 'success');
        });
    }
    
    toggleSubtitles() {
        // This would toggle subtitles in a real player
        this.showNotification('جاري تبديل الترجمة...', 'info');
    }
    
    changePlaybackSpeed(speed) {
        if (this.player) {
            this.player.playbackRate = speed;
            this.showNotification(`سرعة التشغيل: ${speed}x`, 'info');
        }
    }
    
    // Public methods for HTML onclick handlers
    playNext() {
        this.playNextEpisode();
    }
    
    playPrev() {
        this.playPreviousEpisode();
    }
    
    toggleFav() {
        this.toggleFavorite();
    }
    
    download() {
        this.downloadVideo();
    }
    
    share() {
        this.shareVideo();
    }
}

// Initialize player when page loads
let videoPlayer;

document.addEventListener('DOMContentLoaded', function() {
    videoPlayer = new VideoPlayer();
    
    // Load saved progress after a short delay
    setTimeout(() => {
        videoPlayer.loadProgress();
    }, 500);
    
    // Add keyboard shortcuts help
    addKeyboardHelp();
});

function addKeyboardHelp() {
    // Create help button
    const helpBtn = document.createElement('button');
    helpBtn.className = 'keyboard-help-btn';
    helpBtn.innerHTML = '<i class="fas fa-keyboard"></i>';
    helpBtn.title = 'اختصارات لوحة المفاتيح';
    helpBtn.onclick = showKeyboardShortcuts;
    
    // Add styles
    helpBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        border: none;
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s;
    `;
    
    helpBtn.addEventListener('mouseenter', () => {
        helpBtn.style.transform = 'scale(1.1)';
    });
    
    helpBtn.addEventListener('mouseleave', () => {
        helpBtn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(helpBtn);
}

function showKeyboardShortcuts() {
    const shortcuts = [
        { key: 'Space أو K', action: 'تشغيل/إيقاف مؤقت' },
        { key: 'F', action: 'ملء الشاشة' },
        { key: 'M', action: 'كتم/إلغاء كتم الصوت' },
        { key: '→', action: 'تقديم 10 ثواني' },
        { key: '←', action: 'رجوع 10 ثواني' },
        { key: '↑', action: 'زيادة الصوت' },
        { key: '↓', action: 'خفض الصوت' },
        { key: 'N', action: 'الحلقة التالية' },
        { key: 'P', action: 'الحلقة السابقة' },
        { key: 'Ctrl + 0-9', action: 'القفز إلى نسبة مئوية' }
    ];
    
    let message = '🚀 اختصارات لوحة المفاتيح:\n\n';
    shortcuts.forEach(shortcut => {
        message += `🎮 ${shortcut.key}: ${shortcut.action}\n`;
    });
    
    message += '\n💡 يمكنك استخدام هذه الاختصارات أثناء تشغيل الفيديو';
    
    alert(message);
}

// Global functions for HTML onclick handlers
function playNextEpisode() {
    if (videoPlayer) videoPlayer.playNext();
}

function playPreviousEpisode() {
    if (videoPlayer) videoPlayer.playPrev();
}

function toggleFavorite() {
    if (videoPlayer) videoPlayer.toggleFav();
}

function downloadVideo() {
    if (videoPlayer) videoPlayer.download();
}

function shareVideo() {
    if (videoPlayer) videoPlayer.share();
}

function changeQuality(quality) {
    if (videoPlayer) videoPlayer.changeQuality(quality);
}

function playEpisode(episode) {
    if (videoPlayer) videoPlayer.playEpisode(episode);
}

// Add CSS for player notifications
const playerStyles = document.createElement('style');
playerStyles.textContent = `
    .player-notification {
        font-family: 'Cairo', sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    @media (max-width: 768px) {
        .keyboard-help-btn {
            display: none !important;
        }
    }
`;
document.head.appendChild(playerStyles);