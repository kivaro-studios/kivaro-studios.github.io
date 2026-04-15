(() => {
  const translations = window.__KIVARO_TRANSLATIONS__ || {};
  const storageKeys = {
    theme: 'kivaro-theme',
    language: 'kivaro-language'
  };

  const getNestedValue = (obj, path) => path.split('.').reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj);
  const interpolate = (template, vars = {}) => String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? vars[key] : ''));

  let currentLanguage = 'it';
  let currentTheme = document.documentElement.dataset.theme || 'dark';

  const t = (key, vars = {}) => {
    const activeSet = translations[currentLanguage] || translations.it || {};
    const fallbackSet = translations.it || {};
    const value = getNestedValue(activeSet, key) ?? getNestedValue(fallbackSet, key) ?? key;
    return interpolate(value, vars);
  };

  const applyTheme = (theme, persist = true) => {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = currentTheme;
    if (persist) {
      try { localStorage.setItem(storageKeys.theme, currentTheme); } catch (error) {}
    }
    document.querySelectorAll('[data-theme-option]').forEach((button) => {
      button.classList.toggle('active', button.dataset.themeOption === currentTheme);
    });
  };

  const applyLanguage = (language, persist = true) => {
    currentLanguage = language === 'en' ? 'en' : 'it';
    document.documentElement.lang = currentLanguage;
    if (persist) {
      try { localStorage.setItem(storageKeys.language, currentLanguage); } catch (error) {}
    }

    document.querySelectorAll('[data-lang-option]').forEach((button) => {
      button.classList.toggle('active', button.dataset.langOption === currentLanguage);
    });

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      element.setAttribute('title', t(element.dataset.i18nTitle));
    });

    const page = document.body.dataset.page;
    const pageTitle = getNestedValue(translations[currentLanguage], `meta.${page}.title`) || getNestedValue(translations.it || {}, `meta.${page}.title`);
    const pageDescription = getNestedValue(translations[currentLanguage], `meta.${page}.description`) || getNestedValue(translations.it || {}, `meta.${page}.description`);

    if (pageTitle) document.title = pageTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && pageDescription) metaDescription.setAttribute('content', pageDescription);

    document.dispatchEvent(new CustomEvent('kivaro:languagechange', {
      detail: { language: currentLanguage }
    }));
  };

  const setupNavigation = () => {
    const navToggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    const headerContainer = document.querySelector('.site-header .container');
    const headerActions = document.querySelector('.header-actions');
    let actionsPlaceholder = null;

    const closeMenu = () => {
      if (!nav || !navToggle) return;
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    const syncResponsiveActions = () => {
      if (!nav || !headerActions || !headerContainer) return;
      const mobile = window.matchMedia('(max-width: 1280px)').matches;

      if (mobile) {
        if (!actionsPlaceholder) {
          actionsPlaceholder = document.createComment('header-actions-placeholder');
          headerContainer.insertBefore(actionsPlaceholder, headerActions);
        }
        if (headerActions.parentElement !== nav) {
          nav.appendChild(headerActions);
        }
      } else {
        if (actionsPlaceholder && headerActions.parentElement !== headerContainer) {
          actionsPlaceholder.parentNode.insertBefore(headerActions, actionsPlaceholder);
        }
        closeMenu();
      }
    };

    if (navToggle && nav) {
      navToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = nav.classList.toggle('open');
        document.body.classList.toggle('menu-open', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });

      document.addEventListener('click', (event) => {
        if (!nav.classList.contains('open')) return;
        if (nav.contains(event.target) || navToggle.contains(event.target)) return;
        closeMenu();
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
      });
    }

    window.addEventListener('resize', syncResponsiveActions);
    syncResponsiveActions();

    const normalizePath = (pathname) => pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('[data-nav] a').forEach((link) => {
      const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
      const isProjectsSection = currentPath.includes('/projects/') && linkPath.endsWith('/projects');
      if (linkPath === currentPath || isProjectsSection) {
        link.classList.add('active');
      }
    });
  };

  const setupControls = () => {
    document.querySelectorAll('[data-theme-option]').forEach((button) => {
      button.addEventListener('click', () => applyTheme(button.dataset.themeOption));
    });

    document.querySelectorAll('[data-lang-option]').forEach((button) => {
      button.addEventListener('click', () => applyLanguage(button.dataset.langOption));
    });
  };

  const setupYear = () => {
    document.querySelectorAll('[data-current-year]').forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  };

  const setupCardTilt = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = document.querySelectorAll('.card, .hero-card, .stat, .kpi');
    cards.forEach((card) => {
      if (card.classList.contains('about-rail-card')) return;
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 4;
        const rotateX = (0.5 - py) * 4;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  };

  const setupMottoRotators = () => {
    const rotators = document.querySelectorAll('[data-motto-rotator]');
    rotators.forEach((rotator) => {
      const keys = (rotator.dataset.mottos || '').split(',').map((value) => value.trim()).filter(Boolean);
      if (!keys.length) return;
      let index = 0;
      let timer = null;

      const render = () => {
        rotator.textContent = t(keys[index]);
      };

      const start = () => {
        if (timer) window.clearInterval(timer);
        timer = window.setInterval(() => {
          index = (index + 1) % keys.length;
          render();
        }, 2600);
      };

      render();
      start();
      document.addEventListener('kivaro:languagechange', render);
    });
  };

  const setupSwitchboards = () => {
    document.querySelectorAll('[data-switchboard]').forEach((board) => {
      const buttons = Array.from(board.querySelectorAll('[data-switch-option]'));
      const title = board.querySelector('[data-switch-title]');
      const text = board.querySelector('[data-switch-text]');
      if (!buttons.length || !title || !text) return;

      const update = (button) => {
        buttons.forEach((item) => item.classList.toggle('active', item === button));
        title.textContent = t(button.dataset.switchTitleKey);
        text.textContent = t(button.dataset.switchTextKey);
      };

      buttons.forEach((button) => {
        button.addEventListener('click', () => update(button));
      });

      const syncOnLanguageChange = () => update(buttons.find((item) => item.classList.contains('active')) || buttons[0]);
      syncOnLanguageChange();
      document.addEventListener('kivaro:languagechange', syncOnLanguageChange);
    });
  };

  const setupYouTubeEmbeds = () => {
    const isServedOverHttp = /^https?:$/.test(window.location.protocol);

    document.querySelectorAll('[data-youtube-video]').forEach((embed) => {
      const videoId = embed.dataset.youtubeVideo;
      const title = embed.dataset.youtubeTitle || 'YouTube video player';
      const watchUrl = embed.dataset.youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`;
      const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      if (!videoId) return;
      if (embed.dataset.youtubeReady === 'true') return;
      embed.dataset.youtubeReady = 'true';
      embed.innerHTML = '';

      if (isServedOverHttp) {
        const params = new URLSearchParams({
          controls: '1',
          rel: '0',
          modestbranding: '1',
          playsinline: '1',
          iv_load_policy: '3',
          enablejsapi: '1'
        });

        params.set('origin', window.location.origin);

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
        iframe.title = title;
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        iframe.setAttribute('frameborder', '0');
        embed.appendChild(iframe);
        return;
      }

      embed.classList.add('video-embed--preview');
      embed.setAttribute('role', 'group');
      embed.setAttribute('aria-label', title);
      embed.innerHTML = `
        <a class="video-poster" href="${watchUrl}" target="_blank" rel="noopener noreferrer" aria-label="${title}">
          <span class="video-poster-badge">YouTube</span>
          <span class="video-poster-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 6.5v11l9-5.5-9-5.5Z"/>
            </svg>
          </span>
          <span class="video-poster-link">Open on YouTube
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 17 17 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M9 7h8v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </a>`;
      const poster = embed.querySelector('.video-poster');
      if (poster) {
        poster.style.backgroundImage = `linear-gradient(180deg, rgba(7, 17, 31, 0.12) 0%, rgba(7, 17, 31, 0.68) 100%), url("${thumbnailUrl}")`;
      }
    });
  };

  const setupElectricLab = () => {
    const root = document.querySelector('[data-electric-lab]');
    if (!root || !window.d3) return;

    const svgElement = root.querySelector('svg');
    const infoTitle = root.querySelector('[data-electric-info-title]');
    const infoText = root.querySelector('[data-electric-info-text]');
    if (!svgElement || !infoTitle || !infoText) return;

    const nodeBlueprints = [
      { key: 'web', group: 'cyan', active: true },
      { key: 'backend', group: 'cyan', active: true },
      { key: 'desktop', group: 'orange', active: true },
      { key: 'game', group: 'violet', active: true },
      { key: 'ux', group: 'cyan', active: true },
      { key: 'robotics', group: 'green', active: false },
      { key: 'electronics', group: 'green', active: true },
      { key: 'prototype', group: 'orange', active: false },
      { key: 'diagnostics', group: 'violet', active: false },
      { key: 'surprise', group: 'orange', active: false }
    ];

    const links = [
      ['web', 'ux'],
      ['ux', 'surprise'],
      ['web', 'backend'],
      ['backend', 'desktop'],
      ['backend', 'prototype'],
      ['desktop', 'diagnostics'],
      ['diagnostics', 'electronics'],
      ['electronics', 'robotics'],
      ['game', 'ux'],
      ['game', 'surprise'],
      ['prototype', 'surprise'],
      ['electronics', 'web'],
      ['robotics', 'prototype']
    ];

    let simulation = null;

    const colorMap = {
      cyan: 'var(--primary)',
      orange: 'var(--secondary)',
      green: 'var(--accent)',
      violet: 'var(--tertiary)'
    };

    const SHOCK_TRIGGER_CHANCE = 0.25; // 0.25 = 25%: cambia questo valore per regolare la probabilità della scossa
    const zapSound = new Audio('assets/audio/electricity_zap_sound_effect.mp3');
    zapSound.preload = 'auto';

    const playZapSound = () => {
      try {
        zapSound.pause();
        zapSound.currentTime = 0;
        const playPromise = zapSound.play();
        if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
      } catch (_error) {
        // ignora eventuali blocchi del browser sull'audio
      }
    };

    const render = () => {
      if (simulation) simulation.stop();
      svgElement.innerHTML = '';
      const d3 = window.d3;
      const width = 960;
      const height = 560;
      infoTitle.textContent = t('labs.electricInfoDefaultTitle');
      infoText.textContent = t('labs.electricInfoDefaultText');

      const svg = d3.select(svgElement)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', 'electric-link-grad').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', 'var(--primary)');
      grad.append('stop').attr('offset', '100%').attr('stop-color', 'var(--secondary)');

      const nodes = nodeBlueprints.map((node) => ({
        ...node,
        powered: node.active,
        label: t(`electric.nodes.${node.key}.label`),
        desc: t(`electric.nodes.${node.key}.desc`)
      }));

      const dataLinks = links.map(([source, target]) => ({ source, target }));
      const container = svg.append('g');
      const linkLayer = container.append('g');
      const sparkLayer = container.append('g');
      const nodeLayer = container.append('g');

      const link = linkLayer.selectAll('line')
        .data(dataLinks)
        .enter()
        .append('line')
        .attr('stroke', 'url(#electric-link-grad)')
        .attr('stroke-width', 2.2)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.36);

      const node = nodeLayer.selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'electric-node');

      const circle = node.append('circle')
        .attr('r', 15)
        .attr('stroke-width', 2.4)
        .style('cursor', 'pointer');

      const halo = node.append('circle')
        .attr('r', 23)
        .attr('fill', 'none')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.25)
        .attr('pointer-events', 'none');

      const label = node.append('text')
        .attr('class', 'electric-node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', 38)
        .text((d) => d.label);

      const updateNodeStyles = () => {
        circle
          .attr('fill', (d) => d.powered ? colorMap[d.group] : 'rgba(255,255,255,0.04)')
          .attr('stroke', (d) => d.powered ? colorMap[d.group] : 'rgba(255,255,255,0.22)')
          .attr('opacity', (d) => d.powered ? 1 : 0.92);

        halo
          .attr('stroke', (d) => d.powered ? colorMap[d.group] : 'rgba(255,255,255,0.12)')
          .attr('opacity', (d) => d.powered ? 0.55 : 0.15);

        label
          .attr('fill', (d) => d.powered ? 'var(--text)' : 'var(--text-muted)')
          .attr('opacity', (d) => d.powered ? 1 : 0.82);
      };

      const board = root.querySelector('.electric-board');

      const triggerSparkBurst = (d) => {
        circle
          .filter((nodeItem) => nodeItem === d)
          .transition()
          .duration(200)
          .attr('fill', '#9fd3ff')
          .transition()
          .duration(300)
          .attr('fill', colorMap[d.group]);

        if (board) {
          board.classList.remove('is-shaking');
          void board.offsetWidth;
          board.classList.add('is-shaking');
          window.setTimeout(() => board.classList.remove('is-shaking'), 360);
        }

        playZapSound();

        const sparkCount = 14;
        for (let i = 0; i < sparkCount; i += 1) {
          const segments = 4 + Math.floor(Math.random() * 3);
          const distance = 46 + Math.random() * 54;
          const angle = Math.random() * Math.PI * 2;
          const points = [{ x: d.x, y: d.y }];

          for (let segment = 1; segment <= segments; segment += 1) {
            points.push({
              x: d.x + Math.cos(angle) * ((distance * segment) / segments) + (Math.random() - 0.5) * 24,
              y: d.y + Math.sin(angle) * ((distance * segment) / segments) + (Math.random() - 0.5) * 24
            });
          }

          const lineBuilder = d3.line().x((point) => point.x).y((point) => point.y).curve(d3.curveLinear);
          const spark = sparkLayer.append('path')
            .attr('class', 'electric-spark')
            .attr('d', lineBuilder(points))
            .attr('stroke', '#9fd3ff')
            .attr('opacity', 1);

          const length = spark.node().getTotalLength();
          spark
            .attr('stroke-dasharray', length)
            .attr('stroke-dashoffset', length)
            .transition()
            .duration(210)
            .ease(d3.easeCubicOut)
            .attr('stroke-dashoffset', 0)
            .transition()
            .duration(150)
            .ease(d3.easeCubicIn)
            .attr('opacity', 0)
            .remove();

          sparkLayer.append('path')
            .attr('class', 'electric-spark')
            .attr('d', lineBuilder(points.slice(-2)))
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2.5)
            .attr('opacity', 1)
            .transition()
            .duration(240)
            .ease(d3.easeCubicOut)
            .attr('opacity', 0)
            .remove();
        }
      };


      const focusNode = (d) => {
        d.powered = true;
        infoTitle.textContent = d.label;
        infoText.textContent = d.desc;
        updateNodeStyles();

        const shockTriggered = Math.random() < SHOCK_TRIGGER_CHANCE;
        if (shockTriggered) {
          triggerSparkBurst(d);
        }
      };

      node.on('click', (_event, d) => focusNode(d));

      const drag = d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.25).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      node.call(drag);

      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(dataLinks).id((d) => d.key).distance(150).strength(0.52))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(44));

      simulation.on('tick', () => {
        link
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y);

        node.attr('transform', (d) => `translate(${d.x},${d.y})`);
      });

      updateNodeStyles();
    };

    render();
    document.addEventListener('kivaro:languagechange', render);
  };

  const setupAboutCarousel = () => {
    document.querySelectorAll('[data-about-carousel]').forEach((carousel) => {
      if (carousel.dataset.carouselReady === 'true') return;

      const track = carousel.querySelector('[data-card-scroller]');
      const prevButton = carousel.querySelector('[data-about-prev]');
      const nextButton = carousel.querySelector('[data-about-next]');
      const cards = Array.from(track?.children || []).filter((item) => item.classList.contains('card'));
      if (!track || !prevButton || !nextButton || cards.length < 2) return;

      const total = cards.length;
      let currentIndex = 0;
      let pointerStartX = 0;
      let pointerStartY = 0;
      let pointerActive = false;

      const mod = (value, base) => ((value % base) + base) % base;

      const applyStates = () => {
        cards.forEach((card, index) => {
          const forwardDistance = mod(index - currentIndex, total);
          let state = 'after';

          if (forwardDistance === 0) state = 'active';
          else if (forwardDistance === 1) state = 'next';
          else if (forwardDistance === total - 1) state = 'prev';
          else if (forwardDistance < total / 2) state = 'after';
          else state = 'before';

          card.dataset.cardState = state;
          card.setAttribute('aria-hidden', state === 'active' ? 'false' : 'true');
          card.tabIndex = state === 'active' ? 0 : -1;
        });
      };

      const moveBy = (direction) => {
        currentIndex = mod(currentIndex + direction, total);
        applyStates();
      };

      const handlePointerStart = (event) => {
        const point = event.touches ? event.touches[0] : event;
        pointerStartX = point.clientX;
        pointerStartY = point.clientY;
        pointerActive = true;
      };

      const handlePointerEnd = (event) => {
        if (!pointerActive) return;
        const point = event.changedTouches ? event.changedTouches[0] : event;
        const deltaX = point.clientX - pointerStartX;
        const deltaY = point.clientY - pointerStartY;
        pointerActive = false;

        if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
          moveBy(deltaX > 0 ? -1 : 1);
        }
      };

      prevButton.addEventListener('click', () => moveBy(-1));
      nextButton.addEventListener('click', () => moveBy(1));

      track.setAttribute('tabindex', '0');
      track.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          moveBy(-1);
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          moveBy(1);
        }
      });

      track.addEventListener('touchstart', handlePointerStart, { passive: true });
      track.addEventListener('touchend', handlePointerEnd, { passive: true });
      track.addEventListener('pointerdown', handlePointerStart);
      track.addEventListener('pointerup', handlePointerEnd);
      track.addEventListener('pointercancel', () => {
        pointerActive = false;
      });
      track.addEventListener('pointerleave', () => {
        pointerActive = false;
      });

      carousel.dataset.carouselReady = 'true';
      applyStates();
    });
  };


  const setupLabsCarousel = () => {
    document.querySelectorAll('[data-labs-carousel]').forEach((carousel) => {
      if (carousel.dataset.carouselReady === 'true') return;

      const viewport = carousel.querySelector('.labs-carousel__viewport');
      const track = carousel.querySelector('[data-labs-track]');
      const dotsRoot = carousel.querySelector('[data-labs-dots]');
      const slides = Array.from(track?.children || []).filter((item) => item.classList.contains('labs-carousel__slide'));
      if (!viewport || !track || !dotsRoot || slides.length < 2) return;

      const total = slides.length;
      let currentIndex = 1;
      let logicalIndex = 0;
      let isTransitioning = false;
      let pointerStartX = 0;
      let pointerStartY = 0;
      let pointerActive = false;

      const firstClone = slides[0].cloneNode(true);
      const lastClone = slides[slides.length - 1].cloneNode(true);
      firstClone.setAttribute('aria-hidden', 'true');
      lastClone.setAttribute('aria-hidden', 'true');
      track.insertBefore(lastClone, slides[0]);
      track.appendChild(firstClone);

      const dots = slides.map((_, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'labs-carousel__dot';
        button.setAttribute('aria-label', `Vai alla card ${index + 1}`);
        button.addEventListener('click', () => goTo(index));
        dotsRoot.appendChild(button);
        return button;
      });

      const updateDots = () => {
        dots.forEach((dot, index) => {
          const active = index === logicalIndex;
          dot.classList.toggle('is-active', active);
          dot.setAttribute('aria-current', active ? 'true' : 'false');
        });
      };

      const setTrackPosition = (withTransition = true) => {
        const slideWidth = viewport.clientWidth;
        track.style.transition = withTransition ? 'transform 0.46s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
        track.style.transform = `translate3d(-${currentIndex * slideWidth}px, 0, 0)`;
      };

      const normalizeIndex = () => {
        if (currentIndex === 0) {
          currentIndex = total;
          setTrackPosition(false);
        } else if (currentIndex === total + 1) {
          currentIndex = 1;
          setTrackPosition(false);
        }
      };

      const goTo = (index) => {
        if (isTransitioning) return;
        logicalIndex = ((index % total) + total) % total;
        currentIndex = logicalIndex + 1;
        isTransitioning = true;
        setTrackPosition(true);
        updateDots();
      };

      const moveBy = (direction) => {
        if (isTransitioning) return;
        logicalIndex = (logicalIndex + direction + total) % total;
        currentIndex += direction;
        isTransitioning = true;
        setTrackPosition(true);
        updateDots();
      };

      const handlePointerStart = (event) => {
        const point = event.touches ? event.touches[0] : event;
        pointerStartX = point.clientX;
        pointerStartY = point.clientY;
        pointerActive = true;
      };

      const handlePointerEnd = (event) => {
        if (!pointerActive) return;
        const point = event.changedTouches ? event.changedTouches[0] : event;
        const deltaX = point.clientX - pointerStartX;
        const deltaY = point.clientY - pointerStartY;
        pointerActive = false;

        if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
          moveBy(deltaX > 0 ? -1 : 1);
        }
      };

      track.addEventListener('transitionend', () => {
        isTransitioning = false;
        normalizeIndex();
      });

      carousel.addEventListener('touchstart', handlePointerStart, { passive: true });
      carousel.addEventListener('touchend', handlePointerEnd, { passive: true });
      carousel.addEventListener('pointerdown', handlePointerStart);
      carousel.addEventListener('pointerup', handlePointerEnd);
      carousel.addEventListener('pointercancel', () => {
        pointerActive = false;
      });
      carousel.addEventListener('pointerleave', () => {
        pointerActive = false;
      });

      window.addEventListener('resize', () => {
        setTrackPosition(false);
      });

      carousel.dataset.carouselReady = 'true';
      setTrackPosition(false);
      updateDots();
    });
  };

  const initializePreferences = () => {
    let savedTheme = currentTheme;
    let savedLanguage = 'it';

    try {
      savedTheme = localStorage.getItem(storageKeys.theme) || currentTheme;
      savedLanguage = localStorage.getItem(storageKeys.language) || 'it';
    } catch (error) {}

    applyTheme(savedTheme, false);
    applyLanguage(savedLanguage, false);
  };

  window.kivaroSite = {
    t,
    interpolate,
    getLanguage: () => currentLanguage,
    getTheme: () => currentTheme,
    onLanguageChange: (callback) => document.addEventListener('kivaro:languagechange', (event) => callback(event.detail.language))
  };

  setupNavigation();
  setupControls();
  setupYear();
  initializePreferences();
  setupAboutCarousel();
  setupLabsCarousel();
  setupCardTilt();
  setupMottoRotators();
  setupSwitchboards();
  setupYouTubeEmbeds();
  setupElectricLab();
})();
