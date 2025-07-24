
document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    const nav = document.getElementById('gallery-nav');

    function showOverview() {
        galleryContainer.innerHTML = 
            galleries.map(gallery => `
                <div class="gallery-item" data-id="${gallery.id}">
                    <img src="${gallery.coverImage}" alt="${gallery.name}">
                    <div class="gallery-name">${gallery.name}</div>
                </div>
            `).join('');
        addOverviewListeners();
    }

    function showGallery(id) {
        const gallery = galleries.find(g => g.id === id);
        galleryContainer.innerHTML = `
            <div class="gallery-grid">
                ${gallery.images.map(img => `<img src="${img}" alt="">`).join('')}
            </div>
        `;
    }

    function addOverviewListeners() {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                showGallery(item.dataset.id);
            });
        });
    }

    nav.innerHTML = `
        <a href="#" id="overview-link">Overview</a>
        ${galleries.map(g => `<a href="#" data-id="${g.id}">${g.name}</a>`).join('')}
    `;

    document.getElementById('overview-link').addEventListener('click', (e) => {
        e.preventDefault();
        showOverview();
    });

    nav.querySelectorAll('[data-id]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showGallery(link.dataset.id);
        });
    });

    showOverview(); // Initial view
});

