'use strict';

(function initProductCatalog() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));

  const imageMarkup = item => {
    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    const main = images[0] || 'resources/Logo.png';
    const thumbs = images.slice(1, 4).map(src => `
      <img src="${escapeHtml(src)}" alt="${escapeHtml(item.name)} additional view" loading="lazy" />
    `).join('');

    return `
      <div class="catalog-image">
        <img src="${escapeHtml(main)}" alt="${escapeHtml(item.name)}" loading="lazy" />
        ${thumbs ? `<div class="catalog-thumbs">${thumbs}</div>` : ''}
      </div>
    `;
  };

  const cardMarkup = (item, index) => {
    const type = item.type === 'product' ? 'product' : 'service';
    const delay = (index % 3) + 1;
    const specs = (item.specs || []).map(spec => `<span class="spec-tag">${escapeHtml(spec)}</span>`).join('');
    const badgeClass = type === 'product' ? 'badge-blue' : 'badge-cyan';

    return `
      <article class="product-card catalog-card reveal visible reveal-delay-${delay}" data-category="${type}">
        ${imageMarkup(item)}
        <div class="product-info">
          <div class="product-meta">
            <span class="badge ${badgeClass}">${escapeHtml(item.badge || type)}</span>
            <span class="badge badge-green">${type === 'product' ? 'Product' : 'Service'}</span>
          </div>
          <div class="product-name">${escapeHtml(item.name)}</div>
          <p class="product-desc">${escapeHtml(item.summary)}</p>
          <p class="product-desc catalog-detail">${escapeHtml(item.description)}</p>
          <div class="product-specs">${specs}</div>
          <a href="contact.html" class="btn btn-primary w-full" style="justify-content:center;">
            ${escapeHtml(item.cta || 'Contact Us')} <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </article>
    `;
  };

  const render = items => {
    grid.innerHTML = items.map(cardMarkup).join('');
    if (typeof window.SensorMindRevealNow === 'function') {
      window.SensorMindRevealNow();
    }
  };

  fetch('data/products.json')
    .then(response => {
      if (!response.ok) throw new Error('Catalog not found');
      return response.json();
    })
    .then(data => render(Array.isArray(data.items) ? data.items : []))
    .catch(() => {
      grid.innerHTML = `
        <div class="card reveal visible" style="grid-column:1/-1;text-align:center;">
          <h3>Catalog unavailable</h3>
          <p>Please check <code>data/products.json</code> in the repository.</p>
        </div>
      `;
    });
})();
