(() => {
  const nav = document.getElementById('nav');
  const year = document.getElementById('year');
  year.textContent = new Date().getFullYear();

  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 35);
      navTicking = false;
    });
  }, { passive:true });

  // During a rapid scroll, temporarily quiet the exhibition's non-essential
  // transitions. This targets the exact Ecosystem → Exhibition hand-off without
  // adding another per-frame animation loop.
  let fastScrollTimer = 0;
  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let fastScrollRaf = 0;
  window.addEventListener('scroll', () => {
    if (fastScrollRaf) return;
    fastScrollRaf = requestAnimationFrame(() => {
      fastScrollRaf = 0;
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      const dt = Math.max(16, now - lastScrollTime);
      const velocity = dy / dt;
      lastScrollY = window.scrollY;
      lastScrollTime = now;
      const industry = document.querySelector('.industry-story');
      if (!industry) return;
      if (velocity > 1.25) {
        industry.classList.add('is-fast-scroll');
        clearTimeout(fastScrollTimer);
        fastScrollTimer = window.setTimeout(() => industry.classList.remove('is-fast-scroll'), 140);
      }
    });
  }, {passive:true});

  const reveal = document.querySelectorAll('.reveal:not(.eco-panel):not(.eco-trust)');
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(reveal).forEach((el, i) => {
      gsap.fromTo(el, {y:55, opacity:0}, {y:0, opacity:1, duration:.85, ease:'power3.out', delay:(i%4)*.045, scrollTrigger:{trigger:el, start:'top 88%', once:true}});
    });
    gsap.fromTo('.hero-copy > *', {y:30, opacity:0}, {y:0, opacity:1, duration:1, stagger:.12, ease:'power3.out', delay:.25});
    gsap.to('.hero-visual', {y:-50, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:1}});
    gsap.to('.statement-glow', {x:-130, y:70, ease:'none', scrollTrigger:{trigger:'.statement', start:'top bottom', end:'bottom top', scrub:1}});
    gsap.to('.contact-glow', {scale:1.2, x:90, ease:'none', scrollTrigger:{trigger:'.contact', start:'top bottom', end:'bottom top', scrub:1}});
  } else { reveal.forEach(x => x.classList.add('visible')); }

  // Ecosystem panels enter sequentially so the three-column composition reads as one story.
  if (window.gsap && window.ScrollTrigger) {
    const ecoPanels = gsap.utils.toArray('.ecosystem .eco-panel');
    gsap.fromTo(ecoPanels, {y:42, opacity:0}, {y:0, opacity:1, duration:.72, stagger:.16, ease:'power3.out', scrollTrigger:{trigger:'.ecosystem', start:'top 82%', once:true}});
  } else {
    document.querySelectorAll('.ecosystem .eco-panel').forEach(x => { x.style.opacity='1'; x.style.transform='none'; });
  }

  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target, target = Number(el.dataset.count), decimals = String(target).includes('.') ? 1 : 0, suffix = el.dataset.suffix || '';
      const start = performance.now(), duration = 1500;
      const tick = now => { const p=Math.min((now-start)/duration,1), eased=1-Math.pow(1-p,3); el.textContent=(target*eased).toFixed(decimals)+suffix; if(p<1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); counterObserver.unobserve(el);
    });
  }, {threshold:.7});
  counters.forEach(x => counterObserver.observe(x));

  // Cycle the "and more" partner names reliably instead of relying on
  // overlapping CSS animations.
  const moreCycle = document.querySelector('.eco-more-cycle');
  if (moreCycle) {
    const names = [...moreCycle.querySelectorAll(':scope > span')];
    let active = 0;
    const showMoreName = index => names.forEach((name, i) => name.classList.toggle('is-active', i === index));
    showMoreName(0);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && names.length > 1) {
      let cycleTimer = null;
      const cycle = () => {
        active = (active + 1) % names.length;
        showMoreName(active);
      };
      const startCycle = () => {
        if (!cycleTimer) cycleTimer = window.setInterval(cycle, 2200);
      };
      const stopCycle = () => {
        if (cycleTimer) { window.clearInterval(cycleTimer); cycleTimer = null; }
      };
      const eco = moreCycle.closest('.ecosystem');
      if (eco) {
        const ecoVisibility = new IntersectionObserver(entries => {
          const visible = entries[0]?.isIntersecting;
          eco.classList.toggle('is-offscreen', !visible);
          if (visible && document.visibilityState === 'visible') startCycle();
          else stopCycle();
        }, { threshold: 0.02 });
        ecoVisibility.observe(eco);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && !eco.classList.contains('is-offscreen')) startCycle();
          else stopCycle();
        });
      } else {
        startCycle();
      }
    }
  }

  // Pause small continuous CSS effects when their sections are outside the viewport.
  const motionSections = document.querySelectorAll('.hero, .statement, .contact');
  if (motionSections.length) {
    const motionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
    }, { threshold: 0.02 });
    motionSections.forEach(section => motionObserver.observe(section));
  }

  // Presentation-style section lifecycle: keep normal scrolling, but only let the
  // section currently being viewed keep its CSS animation workload active.
  const presentationSections = [...document.querySelectorAll('main > section')];
  if (presentationSections.length && 'IntersectionObserver' in window) {
    let activeSection = null;
    let raf = 0;
    const ratios = new Map();

    const applySectionState = () => {
      raf = 0;
      let winner = null;
      let bestRatio = 0;
      presentationSections.forEach(section => {
        const ratio = ratios.get(section) || 0;
        if (ratio > bestRatio) { bestRatio = ratio; winner = section; }
      });
      if (!winner && presentationSections.length) winner = presentationSections[0];
      if (winner === activeSection) return;
      activeSection = winner;

      presentationSections.forEach(section => {
        const ratio = ratios.get(section) || 0;
        const near = ratio > 0 || section === winner;
        section.classList.toggle('section-active', section === winner);
        section.classList.toggle('section-nearby', near);
        section.classList.toggle('section-dormant', !near);
        section.classList.toggle('section-past', !!winner && presentationSections.indexOf(section) < presentationSections.indexOf(winner));
      });

      // GSAP scrub triggers are intentionally left intact here. Enabling/disabling
      // ScrollTriggers on every section hand-off can itself cause work during a
      // fast scroll. Their animated properties are compositor-friendly, while
      // the presentation lifecycle handles the heavier CSS effects.
    };

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
      if (!raf) raf = requestAnimationFrame(applySectionState);
    }, { threshold: [0, .08, .2, .4, .6, .8], rootMargin: '-18% 0px -18% 0px' });

    presentationSections.forEach(section => sectionObserver.observe(section));
    applySectionState();
  }

  // Keep the hero product/finder container static. Product motion is handled
  // independently by the SFP scene animation so mouse movement cannot jiggle the finder.
})();

/* V5 mega-menu interaction */
(() => {
  const items=[...document.querySelectorAll('.nav-item.has-menu')];
  const closeAll=()=>items.forEach(i=>{i.classList.remove('open');i.querySelector('.nav-link')?.setAttribute('aria-expanded','false')});
  items.forEach(item=>item.querySelector('.nav-link').addEventListener('click',e=>{e.stopPropagation();const open=item.classList.contains('open');closeAll();if(!open){item.classList.add('open');item.querySelector('.nav-link').setAttribute('aria-expanded','true')}}));
  document.addEventListener('click',e=>{if(!e.target.closest('.nav-item.has-menu'))closeAll()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
})();


/* V24 hero SFP compatibility finder — spreadsheet-driven, no auto-selection */
(() => {
  const speed = document.getElementById('finderSpeed');
  const distance = document.getElementById('finderDistance');
  const fiber = document.getElementById('finderFiber');
  const result = document.getElementById('finderResult');
  const finder = document.getElementById('compatFinder');
  const heroImage = document.querySelector('.hero-sfp-image');
  const heroScene = document.querySelector('.hero-sfp-scene');
  const genericImage = 'images/sfp/generic-sfp.webp';
  if (!speed || !distance || !fiber || !result || !heroImage) return;

  const catalogue = [{"type":"single","model":"NNS-8512-02D","name":"1G Multimode","family":"1G Multimode","speed":"1G","distance":"SR","fiber":"Dual Fiber","mode":"Multimode","tx":850,"rx":850},{"type":"single","model":"NN-C12-02","name":"1G Copper","family":"1G Copper","speed":"1G","distance":"SR","fiber":"Copper","mode":null,"tx":null,"rx":null},{"type":"single","model":"NNS-1312-20D","name":"1G Duplex 20KM","family":"1G Duplex","speed":"1G","distance":"20km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNS-1312-40D","name":"1G Duplex 40KM","family":"1G Duplex","speed":"1G","distance":"40km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNS-1512-40D","name":"1G Duplex 40KM","family":"1G Duplex","speed":"1G","distance":"40km","fiber":"Dual Fiber","mode":"Single Mode","tx":1550,"rx":1550},{"type":"bidi","pairId":"BIDI-1G-20KM-01","name":"1G BiDi 20KM Pair","family":"1G BiDi","speed":"1G","distance":"20km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNS-3512Bi-20D","tx":1310,"rx":1550},"sideB":{"model":"NNS-5312Bi-20D","tx":1550,"rx":1310}},{"type":"bidi","pairId":"BIDI-1G-40KM-01","name":"1G BiDi 40KM Pair","family":"1G BiDi","speed":"1G","distance":"40km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNS-3512Bi-40D","tx":1310,"rx":1550},"sideB":{"model":"NNS-5312Bi-40D","tx":1550,"rx":1310}},{"type":"bidi","pairId":"BIDI-1G-80KM-01","name":"1G BiDi 80KM Pair","family":"1G BiDi","speed":"1G","distance":"80km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNS-4512Bi-80D","tx":1490,"rx":1550},"sideB":{"model":"NNS-5412Bi-80D","tx":1550,"rx":1490}},{"type":"bidi","pairId":"BIDI-1G-120KM-01","name":"1G BiDi 120KM Pair","family":"1G BiDi","speed":"1G","distance":"120km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNS-4512Bi-120D","tx":1490,"rx":1550},"sideB":{"model":"NNS-5412Bi-120D","tx":1550,"rx":1490}},{"type":"single","model":"NNS-1512-80D","name":"1G Duplex 80KM","family":"1G Duplex","speed":"1G","distance":"80km","fiber":"Dual Fiber","mode":"Single Mode","tx":1550,"rx":1550},{"type":"single","model":"NNX-8596-03D","name":"10G Multimode","family":"10G Multimode","speed":"10G","distance":"SR","fiber":"Dual Fiber","mode":"Multimode","tx":850,"rx":850},{"type":"single","model":"NNH-CX-03","name":"10G Copper","family":"10G Copper","speed":"10G","distance":"SR","fiber":"Copper","mode":null,"tx":null,"rx":null},{"type":"single","model":"NNX-1396-10D","name":"10G Duplex 10KM","family":"10G Duplex","speed":"10G","distance":"10km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNX-1396-20D","name":"10G Duplex 20KM","family":"10G Duplex","speed":"10G","distance":"20km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNX-1396-40D","name":"10G Duplex 40KM","family":"10G Duplex","speed":"10G","distance":"40km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNX-1596-40D","name":"10G Duplex 40KM","family":"10G Duplex","speed":"10G","distance":"40km","fiber":"Dual Fiber","mode":"Single Mode","tx":1550,"rx":1550},{"type":"single","model":"NNX-1596-80D","name":"10G Duplex 80KM","family":"10G Duplex","speed":"10G","distance":"80km","fiber":"Dual Fiber","mode":"Single Mode","tx":1550,"rx":1550},{"type":"bidi","pairId":"BIDI-10G-20KM-01","name":"10G BiDi 20KM Pair","family":"10G BiDi","speed":"10G","distance":"20km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNX-2396Bi-20D","tx":1270,"rx":1330},"sideB":{"model":"NNX-3296Bi-20D","tx":1330,"rx":1270}},{"type":"bidi","pairId":"BIDI-10G-40KM-01","name":"10G BiDi 40KM Pair","family":"10G BiDi","speed":"10G","distance":"40km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNX-2396Bi-40D","tx":1270,"rx":1330},"sideB":{"model":"NNX-3296Bi-40D","tx":1330,"rx":1270}},{"type":"bidi","pairId":"BIDI-10G-60KM-01","name":"10G BiDi 60KM Pair","family":"10G BiDi","speed":"10G","distance":"60km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNX-2396Bi-60D","tx":1270,"rx":1330},"sideB":{"model":"NNX-3296Bi-60D","tx":1330,"rx":1270}},{"type":"bidi","pairId":"BIDI-10G-80KM-01","name":"10G BiDi 80KM Pair","family":"10G BiDi","speed":"10G","distance":"80km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNX-2396Bi-80D","tx":1270,"rx":1330},"sideB":{"model":"NNX-3296Bi-80D","tx":1330,"rx":1270}},{"type":"bidi","pairId":"BIDI-10G-80KM-02","name":"10G BiDi 80KM Pair","family":"10G BiDi","speed":"10G","distance":"80km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNX-4596Bi-80D","tx":1490,"rx":1550},"sideB":{"model":"NNX-5496Bi-80D","tx":1550,"rx":1490}},{"type":"single","model":"NNQ-40G-SR4","name":"40G Multimode","family":"40G Multimode","speed":"40G","distance":"SR","fiber":"Dual Fiber","mode":"Multimode","tx":850,"rx":850},{"type":"single","model":"NNQ-40G-10D","name":"40G Duplex 10KM","family":"40G Duplex","speed":"40G","distance":"10km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-40G-20D","name":"40G Duplex 20KM","family":"40G Duplex","speed":"40G","distance":"20km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-40G-40CD","name":"40G Duplex 40KM","family":"40G Duplex","speed":"40G","distance":"40km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-40G-40OD","name":"40G Duplex 40KM","family":"40G Duplex","speed":"40G","distance":"40km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-40G-60D","name":"40G Duplex 60KM","family":"40G Duplex","speed":"40G","distance":"60km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-40G-80D","name":"40G Duplex 80KM","family":"40G Duplex","speed":"40G","distance":"80km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-100G-SR4","name":"100G Multimode","family":"100G Multimode","speed":"100G","distance":"SR","fiber":"Dual Fiber","mode":"Multimode","tx":850,"rx":850},{"type":"single","model":"NNQ-100G-20D","name":"100G Duplex 20KM","family":"100G Duplex","speed":"100G","distance":"20km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-100G-40D","name":"100G Duplex 40KM","family":"100G Duplex","speed":"100G","distance":"40km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"single","model":"NNQ-100G-80D","name":"100G Duplex 80KM","family":"100G Duplex","speed":"100G","distance":"80km","fiber":"Dual Fiber","mode":"Single Mode","tx":1310,"rx":1310},{"type":"bidi","pairId":"BIDI-100G-10KM-01","name":"100G BiDi 10KM Pair","family":"100G BiDi","speed":"100G","distance":"10km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNQ-32CBi-10D","tx":1311,"rx":1271},"sideB":{"model":"NNQ-23CBi-10D","tx":1271,"rx":1311}},{"type":"bidi","pairId":"BIDI-100G-20KM-01","name":"100G BiDi 20KM Pair","family":"100G BiDi","speed":"100G","distance":"20km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNQ-32CBi-20D","tx":1311,"rx":1291},"sideB":{"model":"NNQ-23CBi-20D","tx":1291,"rx":1311}},{"type":"bidi","pairId":"BIDI-100G-30KM-01","name":"100G BiDi 30KM Pair","family":"100G BiDi","speed":"100G","distance":"30km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNQ-32CBi-30D","tx":1311,"rx":1291},"sideB":{"model":"NNQ-23CBi-30D","tx":1291,"rx":1311}},{"type":"bidi","pairId":"BIDI-100G-40KM-01","name":"100G BiDi 40KM Pair","family":"100G BiDi","speed":"100G","distance":"40km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNQ-94CBi-40D","tx":1309,"rx":1304},"sideB":{"model":"NNQ-49CBi-40D","tx":1304,"rx":1309}},{"type":"bidi","pairId":"BIDI-100G-80KM-01","name":"100G BiDi 80KM Pair","family":"100G BiDi","speed":"100G","distance":"80km","fiber":"Single Fiber","mode":"Single Mode","sideA":{"model":"NNQ-32CBi-80D","tx":1309,"rx":1273},"sideB":{"model":"NNQ-23CBi-80D","tx":1273,"rx":1309}}]

  const unique = arr => [...new Set(arr.filter(v => v !== undefined && v !== null && String(v).trim() !== ''))].sort((a,b) => {
    const sa = String(a).trim(), sb = String(b).trim();
    // Always place SR first, followed by numeric distances (10km, 20km, 40km...).
    const aSR = sa.toLowerCase() === 'sr', bSR = sb.toLowerCase() === 'sr';
    if (aSR && !bSR) return -1;
    if (!aSR && bSR) return 1;
    const na = parseFloat(sa), nb = parseFloat(sb);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    if (Number.isFinite(na)) return -1;
    if (Number.isFinite(nb)) return 1;
    return sa.localeCompare(sb);
  });

  const setOptions = (select, values, placeholder='Select') => {
    select.innerHTML = `<option value="">${placeholder}</option>` +
      values.map(v => `<option value="${String(v).replace(/"/g,'&quot;')}">${v}</option>`).join('');
    select.value = '';
    select.disabled = values.length === 0;
  };

  const imageNameFor = (match) => {
    const speedPart = String(match.speed || '').trim().toLowerCase();
    const distancePart = String(match.distance || '').trim().toLowerCase().replace(/\s+/g, '');
    const family = String(match.family || '').toLowerCase();
    let familyPart = family;
    if (family.includes('bidi')) familyPart = 'bidi';
    else if (family.includes('duplex')) familyPart = 'duplex';
    else if (family.includes('multimode')) familyPart = 'multimode';
    else {
      familyPart = family.replace(speedPart, '').trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'sfp';
    }
    // Copper optics use dedicated image names, e.g. 1g_copper_sr.webp / 10g_copper_sr.webp.
    if (family.includes('copper')) {
      return `images/sfp/${speedPart}_copper_${distancePart}.webp`;
    }
    return `images/sfp/${speedPart}_${familyPart}_${distancePart}.webp`;
  };

  let imageRequest = 0;
  const showGenericImage = () => {
    imageRequest++;
    heroImage.classList.remove('is-product');
    heroScene && heroScene.classList.remove('is-product-active');
    heroImage.src = genericImage;
    heroImage.alt = 'Netro SFP optical transceiver';
  };
  const showProductImage = (match) => {
    const request = ++imageRequest;
    const src = imageNameFor(match);
    const absoluteSrc = new URL(src, document.baseURI).href;
    heroImage.classList.remove('is-product');
    heroScene && heroScene.classList.remove('is-product-active');
    heroImage.classList.add('is-changing');

    // Preload the actual product image before replacing the generic image.
    // Using document.baseURI makes this work when the site is hosted from
    // a sub-folder as well as from the domain root.
    const probe = new Image();
    probe.onload = () => {
      if (request !== imageRequest) return;
      heroImage.src = absoluteSrc + (absoluteSrc.includes('?') ? '&' : '?') + 'v=' + Date.now();
      heroImage.alt = `${match.name || 'Netro SFP'} product image`;
      heroImage.classList.remove('is-changing');
      void heroImage.offsetWidth;
      heroImage.classList.add('is-product');
      heroScene && heroScene.classList.add('is-product-active');
    };
    probe.onerror = () => {
      if (request !== imageRequest) return;
      console.warn('[Netro Optics Finder] Product image not found:', absoluteSrc);
      heroImage.classList.remove('is-changing');
      showGenericImage();
    };
    probe.src = absoluteSrc;
  };

  let currentMatches = [];
  let currentIndex = 0;
  let touchStartX = null;

  const clearResult = (message='Select your speed, distance, and fiber type to see matching optics.') => {
    currentMatches = [];
    currentIndex = 0;
    finder && finder.classList.remove('is-configured');
    result.innerHTML = `<div class="finder-placeholder">${message}</div>`;
    showGenericImage();
  };

  const renderMatch = (match) => {
    if (match.type === 'bidi') {
      const wavelength = match.sideA.tx != null && match.sideB.tx != null
        ? `${match.sideA.tx}nm ↔ ${match.sideB.tx}nm`
        : '';
      return `<div class="finder-match finder-bidi-match">
        <div class="finder-product-meta">
          <small>${match.family} · ${match.fiber}</small>
          <strong>${match.name}</strong>
          <div class="finder-product-name">${match.sideA.model} · TX ${match.sideA.tx}nm · RX ${match.sideA.rx}nm</div>
          <div class="finder-product-name">${match.sideB.model} · TX ${match.sideB.tx}nm · RX ${match.sideB.rx}nm</div>
          <div class="finder-specs">${match.speed} · ${match.distance} · ${match.fiber} · ${match.mode}${wavelength ? ' · ' + wavelength : ''}</div>
        </div>
        <a class="finder-get" href="#contact">Get this pair <span>→</span></a>
      </div>`;
    }
    return `<div class="finder-match">
      <div class="finder-product-meta">
        <small>${match.family} · ${match.fiber}</small>
        <strong>${match.model}</strong>
        <div class="finder-product-name">${match.name}</div>
        <div class="finder-specs">${match.speed} · ${match.distance}${match.tx != null && match.rx != null ? ` · TX ${match.tx}nm · RX ${match.rx}nm` : ''} · ${match.fiber} · ${match.mode}</div>
      </div>
      <a class="finder-get" href="#contact">Get this one <span>→</span></a>
    </div>`;
  };

  const showMatch = (index, direction = 0) => {
    if (!currentMatches.length) return;
    currentIndex = (index + currentMatches.length) % currentMatches.length;
    const match = currentMatches[currentIndex];
    showProductImage(match);

    const slide = result.querySelector('.finder-slide');
    if (slide) {
      slide.classList.remove('is-next', 'is-prev', 'is-active');
      void slide.offsetWidth;
      if (direction > 0) slide.classList.add('is-next');
      if (direction < 0) slide.classList.add('is-prev');
      slide.innerHTML = renderMatch(match);
      slide.classList.add('is-active');
    }

    const position = result.querySelector('.finder-position');
    if (position) position.textContent = `${currentIndex + 1} / ${currentMatches.length}`;
  };

  const renderMatchControls = () => {
    const multiple = currentMatches.length > 1;
    showProductImage(currentMatches[0]);
    result.ontouchstart = null;
    result.ontouchend = null;
    const controls = multiple ? `
      <button class="finder-nav finder-nav-prev" type="button" aria-label="Previous matching optic" title="Previous matching optic">‹</button>
      <button class="finder-nav finder-nav-next" type="button" aria-label="Next matching optic" title="Next matching optic">›</button>
    ` : '';
    result.innerHTML = `
      <div class="finder-count-row">
        <div class="finder-count">${currentMatches.length} matching ${currentMatches.length === 1 ? 'offering' : 'offerings'}</div>
        ${multiple ? `<span class="finder-compare-hint"><span class="finder-compare-icon">↔</span> Compare matches <b class="finder-position">1 / ${currentMatches.length}</b></span>` : ''}
      </div>
      <div class="finder-viewport${multiple ? ' has-multiple' : ''}">
        ${controls}
        <div class="finder-slide">${renderMatch(currentMatches[0])}</div>
      </div>`;

    if (multiple) {
      result.querySelector('.finder-nav-prev').addEventListener('click', () => showMatch(currentIndex - 1, -1));
      result.querySelector('.finder-nav-next').addEventListener('click', () => showMatch(currentIndex + 1, 1));
      result.ontouchstart = e => {
        touchStartX = e.changedTouches[0].clientX;
      };
      result.ontouchend = e => {
        if (touchStartX === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(delta) < 45) return;
        showMatch(currentIndex + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
      };
    }
  };

  const updateDistances = () => {
    const distances = unique(catalogue
      .filter(x => x.speed === speed.value)
      .map(x => x.distance));
    setOptions(distance, distances);
    setOptions(fiber, []);
    clearResult();
  };

  const updateFiberTypes = () => {
    const fibers = unique(catalogue
      .filter(x => x.speed === speed.value && x.distance === distance.value)
      .map(x => x.fiber));
    setOptions(fiber, fibers);
    clearResult();
  };

  const render = () => {
    if (!speed.value || !distance.value || !fiber.value) {
      clearResult();
      return;
    }

    const matches = catalogue.filter(x =>
      x.speed === speed.value &&
      x.distance === distance.value &&
      x.fiber === fiber.value
    );

    if (!matches.length) {
      currentMatches = [];
      currentIndex = 0;
      result.ontouchstart = null;
      result.ontouchend = null;
      result.innerHTML = `<div class="finder-empty"><div><strong>No catalogue match for this combination yet.</strong><br>Talk to Netro and we’ll confirm the nearest available optic.</div><a href="#contact">Ask our team ↗</a></div>`;
      showGenericImage();
      return;
    }

    finder && finder.classList.add('is-configured');
    currentMatches = matches;
    currentIndex = 0;
    renderMatchControls();
  };

  speed.addEventListener('change', updateDistances);
  distance.addEventListener('change', updateFiberTypes);
  fiber.addEventListener('change', render);

  setOptions(speed, unique(catalogue.map(x => x.speed)));
  setOptions(distance, []);
  setOptions(fiber, []);
  clearResult();
})();


/* Global Netro theme — one preference shared by every page. */
(() => {
  const KEY = 'netro-theme';
  const root = document.documentElement;
  const read = () => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      const cookie = document.cookie.match(/(?:^|;\s*)netro-theme=(light|dark)(?:;|$)/);
      if (cookie) return cookie[1];
    } catch (_) {}
    return root.dataset.theme === 'light' ? 'light' : 'dark';
  };
  const write = theme => {
    try {
      localStorage.setItem(KEY, theme);
      document.cookie = `${KEY}=${theme};path=/;max-age=31536000;SameSite=Lax`;
    } catch (_) {}
  };
  const update = theme => {
    const normalized = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = normalized;
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      const light = normalized === 'light';
      toggle.setAttribute('aria-pressed', String(light));
      toggle.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    }
    return normalized;
  };

  // Always restore the saved global preference; never silently reset to dark.
  update(read());
  write(root.dataset.theme);

  const sync = () => update(read());
  window.addEventListener('pageshow', sync);
  window.addEventListener('focus', sync);
  window.addEventListener('storage', e => { if (e.key === KEY) sync(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });

  const toggle = document.getElementById('themeToggle');
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    write(next);
    update(next);
    window.dispatchEvent(new CustomEvent('netro-theme-change', { detail: next }));
  });
})();

/* =========================================================
   V46 — lightweight industry story
   No per-frame JS loop and no continuous decorative animation.
   The exhibition carousel changes only when an event changes.
   ========================================================= */
(() => {
  const root = document.querySelector('[data-industry-story]');
  if (!root) return;

  const mainImage = root.querySelector('.industry-main-image');
  const secondaryImage = root.querySelector('.industry-secondary-image');
  const photoMain = root.querySelector('.industry-photo-main');
  const eventKicker = root.querySelector('.industry-event-kicker');
  const eventTitle = root.querySelector('.industry-event-title');
  const eventLocation = root.querySelector('.industry-event-location');
  const captionTitle = root.querySelector('.industry-photo-caption-title');
  const progress = root.querySelector('.industry-timeline-track span');
  const steps = [...root.querySelectorAll('.industry-step')];
  const visual = root.querySelector('.industry-visual');
  const story = root.closest('.industry-story');

  if (!mainImage || !secondaryImage || !photoMain || !story) return;

  const events = [
    {main:'images/industry/2021-delhi-main.webp',secondary:'images/industry/2021-delhi-secondary.webp',kicker:'MARCH 2021 · PRAGATI MAIDAN',title:'Pragati Maidan',location:'New Delhi · India',caption:'THE FLOOR IS WHERE CONNECTIONS START.',alt:'Netro Networks exhibition booth at Pragati Maidan, New Delhi, March 2021'},
    {main:'images/industry/2021-hyderabad-main.webp',secondary:'images/industry/2021-hyderabad-secondary.webp',kicker:'AUGUST 2021 · HITEX',title:'HITEX Exhibition Center',location:'Hyderabad · India',caption:'PRODUCTS MEET THE PEOPLE WHO USE THEM.',alt:'Netro Networks exhibition booth at HITEX Exhibition Center, Hyderabad, August 2021'},
    {main:'images/industry/2022-delhi-main.webp',secondary:'images/industry/2022-delhi-secondary.webp',kicker:'MARCH 2022 · PRAGATI MAIDAN',title:'Pragati Maidan',location:'New Delhi · India',caption:'THE FLOOR IS WHERE CONNECTIONS START.',alt:'Netro Networks exhibition booth at Pragati Maidan, New Delhi, March 2022'},
    {main:'images/industry/2022-hyderabad-main.webp',secondary:'images/industry/2022-hyderabad-secondary.webp',kicker:'AUGUST 2022 · HITEX',title:'HITEX Exhibition Center',location:'Hyderabad · India',caption:'THE NETWORKING COMMUNITY, IN ONE PLACE.',alt:'Visitors gathered at the Netro Networks exhibition booth at HITEX, Hyderabad, August 2022'},
    {main:'images/industry/2023-kolkata-main.webp',secondary:'images/industry/2023-kolkata-secondary.webp',kicker:'JANUARY 2023 · SCIENCE CITY',title:'Science City',location:'Kolkata · India',caption:'FROM DEMOS TO THE NEXT CONNECTION.',alt:'Visitors and the Netro Networks team at an exhibition in Science City, Kolkata, January 2023'}
  ];

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const DURATION = 4800;
  let active = 0;
  let visible = false;
  let hovering = false;
  let timer = 0;
  let transitionToken = 0;

  const imageCache = new Map();

  const preload = ev => {
    if (imageCache.has(ev.main)) return imageCache.get(ev.main);
    const img = new Image();
    img.decoding = 'async';
    const promise = new Promise(resolve => {
      img.onload = () => {
        if (img.decode) {
          img.decode().catch(() => {}).finally(() => resolve(img));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => resolve(img);
    });
    imageCache.set(ev.main, promise);
    img.src = ev.main;
    return promise;
  };

  const secondaryCache = new Map();
  const preloadSecondary = ev => {
    if (secondaryCache.has(ev.secondary)) return secondaryCache.get(ev.secondary);
    const img = new Image();
    img.decoding = 'async';
    const promise = new Promise(resolve => {
      img.onload = () => {
        if (img.decode) {
          img.decode().catch(() => {}).finally(() => resolve(img));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => resolve(img);
    });
    secondaryCache.set(ev.secondary, promise);
    img.src = ev.secondary;
    return promise;
  };

  const prepareThumb = (step, i) => {
    const thumb = step.querySelector('.industry-step-thumb');
    if (!thumb || thumb.dataset.loaded === '1') return;
    thumb.style.backgroundImage = `url("${events[i].secondary}")`;
    thumb.dataset.loaded = '1';
  };

  steps.forEach((step, i) => {
    step.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    step.addEventListener('mouseenter', () => prepareThumb(step, i), {passive:true});
    step.addEventListener('focusin', () => prepareThumb(step, i));
  });

  // The image element is already lazy-loaded by the browser; don't force a decode
  // before the user reaches the exhibition section.

  const updateSteps = () => {
    steps.forEach((step, i) => {
      const on = i === active;
      step.classList.toggle('is-active', on);
      step.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (progress) {
      progress.style.width = `${((active + 1) / events.length) * 100}%`;
    }
  };

  const updateUI = ev => {
    mainImage.src = ev.main;
    secondaryImage.src = ev.secondary;
    mainImage.alt = ev.alt;
    if (eventKicker) eventKicker.textContent = ev.kicker;
    if (eventTitle) eventTitle.textContent = ev.title;
    if (eventLocation) eventLocation.textContent = ev.location;
    if (captionTitle) captionTitle.textContent = ev.caption;
  };

  const setActive = (next, immediate = false) => {
    next = (next + events.length) % events.length;
    const changed = next !== active;
    active = next;
    updateSteps();

    const ev = events[active];
    const token = ++transitionToken;

    if (immediate || reduced || !changed) {
      updateUI(ev);
      photoMain.classList.remove('is-changing');
      mainImage.style.opacity = '1';
      secondaryImage.style.opacity = '1';
      return;
    }

    // Fetch and decode the next image before starting the visual transition.
    // This prevents the brief blank/loading flash while keeping the rest of the gallery unloaded.
    photoMain.classList.add('is-changing');
    mainImage.style.opacity = '0';
    secondaryImage.style.opacity = '0';

    Promise.all([preload(ev), preloadSecondary(ev)])
      .then(() => {
        if (token !== transitionToken) return;
        updateUI(ev);
        mainImage.style.opacity = '1';
        secondaryImage.style.opacity = '1';
        window.setTimeout(() => {
          if (token === transitionToken) photoMain.classList.remove('is-changing');
        }, 560);
      });
  };

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };

  const scheduleNext = () => {
    clearTimer();
    if (!visible || hovering || reduced || document.visibilityState !== 'visible') return;
    timer = window.setTimeout(() => {
      setActive(active + 1);
      scheduleNext();
    }, DURATION);
  };

  const pauseInteraction = () => {
    hovering = true;
    story.classList.add('is-paused');
    clearTimer();
  };

  const resumeInteraction = () => {
    hovering = false;
    story.classList.remove('is-paused');
    scheduleNext();
  };

  steps.forEach((step, i) => {
    step.addEventListener('click', () => {
      setActive(i, false);
      scheduleNext();
    });
    step.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const target = (i + dir + steps.length) % steps.length;
        setActive(target, false);
        steps[target].focus();
        scheduleNext();
      }
    });
  });

  visual?.addEventListener('mouseenter', pauseInteraction);
  visual?.addEventListener('mouseleave', resumeInteraction);
  visual?.addEventListener('focusin', pauseInteraction);
  visual?.addEventListener('focusout', e => {
    if (!visual.contains(e.relatedTarget)) resumeInteraction();
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      visible = entry.isIntersecting;
      story.classList.toggle('is-offscreen', !visible);
      if (visible) {
        // The exhibition gallery is a small, fixed five-event sequence. Once the
        // section enters the viewport, prepare the complete gallery in the
        // background so later transitions never wait for network/decode work.
        // This is intentionally scoped to this section rather than page load.
        events.forEach(ev => {
          preload(ev);
          preloadSecondary(ev);
        });
        scheduleNext();
      } else {
        clearTimer();
      }
    });
  }, {threshold:0.08, rootMargin:'40px 0px 40px'});

  observer.observe(story);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (visible) {
        scheduleNext();
      }
    } else {
      clearTimer();
    }
  });

  setActive(0, true);
})();

