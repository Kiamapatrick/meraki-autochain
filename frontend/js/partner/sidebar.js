/**
 * Meraki AutoChain — Sidebar
 * Renders role-specific navigation and marks the active page.
 */

const NAV_CONFIG = {
  inspector: [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard',       label: 'Dashboard',    href: '/pages/partner/inspector/dashboard.html',       icon: 'grid' },
        { id: 'new-inspection',  label: 'New Inspection', href: '/pages/partner/inspector/new-inspection.html', icon: 'plus-circle' },
        { id: 'vehicles',        label: 'Vehicles',     href: '/pages/partner/inspector/vehicles.html',        icon: 'car' },
      ]
    },
  ],
  dealer: [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard',  label: 'Dashboard',           href: '/pages/partner/dealer/dashboard.html',   icon: 'grid' },
        { id: 'inventory',  label: 'Inventory',           href: '/pages/partner/dealer/inventory.html',   icon: 'list' },
        { id: 'requests',   label: 'Verification Requests', href: '/pages/partner/dealer/requests.html', icon: 'shield' },
      ]
    },
  ],
  insurance: [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard',     href: '/pages/partner/insurance/dashboard.html', icon: 'grid' },
        { id: 'reports',   label: 'Reports',       href: '/pages/partner/insurance/reports.html',  icon: 'file-text' },
      ]
    },
  ],
};

// SVG icon paths
const ICONS = {
  'grid': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>`,
  'plus-circle': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="10" cy="10" r="7.5"/><path d="M10 7v6M7 10h6"/></svg>`,
  'car': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10L6 5h8l2 5"/><rect x="2" y="10" width="16" height="5" rx="1.5"/><circle cx="5.5" cy="15" r="1.5"/><circle cx="14.5" cy="15" r="1.5"/></svg>`,
  'list': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 5h9M7 10h9M7 15h9M4 5h.5M4 10h.5M4 15h.5"/></svg>`,
  'shield': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.5L3.5 5v5c0 3.5 2.8 6.2 6.5 7.5 3.7-1.3 6.5-4 6.5-7.5V5L10 2.5z"/></svg>`,
  'file-text': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5H5.5A1.5 1.5 0 004 4v12a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0016 16V6.5L12 2.5z"/><path d="M12 2.5V6.5H16"/><path d="M7 10h6M7 13h4"/></svg>`,
  'log-out': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 17H4.5A1.5 1.5 0 013 15.5v-11A1.5 1.5 0 014.5 3H8"/><path d="M13 14l4-4-4-4"/><path d="M17 10H8"/></svg>`,
};

/**
 * Initialise sidebar into #sidebar element.
 * @param {string} role
 * @param {{ name, email }} user
 * @param {string} activeId
 */
function initSidebar(role, user, activeId) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const roleLabels = {
    inspector: 'Inspector',
    dealer:    'Dealer',
    insurance: 'Insurance',
  };

  const initials = (user.name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navSections = (NAV_CONFIG[role] || []).map(section => `
    <div class="sidebar-nav-section">
      <div class="sidebar-section-label">${section.label}</div>
      ${section.items.map(item => `
        <a href="${item.href}"
           class="sidebar-nav-link${item.id === activeId ? ' active' : ''}"
           data-id="${item.id}">
          <span class="sidebar-nav-icon">${ICONS[item.icon] || ''}</span>
          ${item.label}
        </a>
      `).join('')}
    </div>
  `).join('');

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-mark">
        <div class="sidebar-logo-icon">
          ${logoSVG()}
        </div>
        <div>
          <div class="sidebar-logo-text">Meraki</div>
          <div class="sidebar-logo-sub">AutoChain</div>
        </div>
      </div>
    </div>

    <div class="sidebar-role-tag">${roleLabels[role] || role} Portal</div>

    <nav class="sidebar-nav">
      ${navSections}
    </nav>

    <button class="logout-btn" id="sidebar-logout">
      ${ICONS['log-out']}
      Sign out
    </button>

    <div class="sidebar-user" id="sidebar-user-btn">
      <div class="sidebar-user-avatar">${initials}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${escapeHTML(user.name || 'Partner User')}</div>
        <div class="sidebar-user-role">${roleLabels[role] || role}</div>
      </div>
    </div>
  `;

  document.getElementById('sidebar-logout').addEventListener('click', () => {
    logout();
  });
}

function logoSVG() {
  return `<svg viewBox="0 0 18 18" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 13 L9 3 L16 13 H12 L9 8 L6 13 Z" fill="white"/>
  </svg>`;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
