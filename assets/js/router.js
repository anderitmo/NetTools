/**
 * NetTools BR - Client-side Router
 */

export class Router {
  constructor(routes, defaultRoute = 'home') {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.container = document.getElementById('main-content');

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    let hash = window.location.hash.slice(1);
    if (!hash || !this.routes[hash]) {
      hash = this.defaultRoute;
    }

    const route = this.routes[hash];

    // Update navigation active states
    this.updateActiveNav(hash);

    // Scroll to top
    window.scrollTo(0, 0);

    // Render route component
    if (this.container && route && typeof route.render === 'function') {
      this.container.innerHTML = '';
      route.render(this.container);
    }
  }

  updateActiveNav(hash) {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${hash}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile menu if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  }

  navigateTo(hash) {
    window.location.hash = `#${hash}`;
  }
}
