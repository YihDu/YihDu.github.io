
document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    const nav = document.getElementById('gallery-nav');

    // Generate navigation menu
    function generateNav(activeId) {
        nav.innerHTML = `
            <a href="#" id="overview-link" class="${!activeId ? 'active' : ''}">Overview</a>
            ${galleries.map(g => `<a href="#" data-id="${g.id}" class="${activeId === g.id ? 'active' : ''}">${g.name}</a>`).join('')}
        `;

        document.getElementById('overview-link').addEventListener('click', (e) => {
            e.preventDefault();
            showOverview();
            generateNav(null);
        });

        nav.querySelectorAll('[data-id]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showGallery(link.dataset.id);
                generateNav(link.dataset.id);
            });
        });
    }

    // Show overview - album grid
    function showOverview() {
        galleryContainer.innerHTML = `
            <h2 style="margin-bottom: 16px;">Gallery</h2>
            <div class="gallery-note">Moments from My Travels. </div>
            <div class="album-grid fade-in" style="margin-top: 20px;">
                ${galleries.map(gallery => `
                    <a href="#" class="album-card" data-id="${gallery.id}">
                        <div class="album-cover">
                            <img src="${gallery.coverImage}" alt="${gallery.name}">
                        </div>
                        <div class="album-info">
                            <h3>${gallery.name}</h3>
                            <p class="album-meta">${gallery.date || ''} · ${gallery.location || ''}</p>
                            <p class="album-desc">${gallery.description || ''}</p>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;

        // Add click listeners to album cards
        document.querySelectorAll('.album-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                showGallery(card.dataset.id);
                generateNav(card.dataset.id);
                window.scrollTo(0, 0);
            });
        });
    }

    // Show single gallery with masonry layout
    function showGallery(id) {
        const gallery = galleries.find(g => g.id === id);
        if (!gallery) return;

        // Generate photo items with captions
        const photoItems = gallery.photos ? gallery.photos.map(photo => `
            <div class="masonry-item fade-in" onclick="openLightbox('${photo.src}', '${photo.caption || ''}', '${photo.desc || ''}')">
                <img src="${photo.src}" alt="${photo.caption || ''}" loading="lazy">
                ${photo.caption || photo.desc ? `
                <div class="photo-info">
                    ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
                    ${photo.desc ? `<div class="photo-desc">${photo.desc}</div>` : ''}
                </div>
                ` : ''}
            </div>
        `).join('') :
        // Fallback for galleries without photo metadata
        gallery.images.map(img => `
            <div class="masonry-item fade-in" onclick="openLightbox('${img}', '', '')">
                <img src="${img}" alt="" loading="lazy">
            </div>
        `).join('');

        galleryContainer.innerHTML = `
            <div class="gallery-header fade-in">
                <h2>${gallery.name}</h2>
                <p class="gallery-meta">${gallery.date || ''} ${gallery.location ? '· ' + gallery.location : ''}</p>
            </div>
            <div class="masonry-gallery">
                ${photoItems}
            </div>
        `;

        // Scroll to top
        window.scrollTo(0, 0);
    }

    // Initialize
    generateNav(null);
    showOverview();

    // Add loaded class when images finish loading
    function setupImageLoading() {
        const images = galleryContainer.querySelectorAll('.masonry-item img');
        images.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
            }
        });
    }

    // Setup image loading after gallery is rendered
    const originalShowGallery = showGallery;
    showGallery = function(id) {
        originalShowGallery(id);
        setupImageLoading();
    };
});

// Lightbox functions
function openLightbox(src, caption, desc) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const captionDiv = document.getElementById('lightbox-caption');

    img.src = src;
    captionDiv.innerHTML = caption || desc ? `
        ${caption ? `<div class="caption-title">${caption}</div>` : ''}
        ${desc ? `<div class="caption-desc">${desc}</div>` : ''}
    ` : '';

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

// Keyboard support for lightbox
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});
