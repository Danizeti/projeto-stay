/* =========================================================
   STAYMAIS - SCRIPT PRINCIPAL (JSON EXTERNO)
   =========================================================
   Onde editar:
   1) SITE_CONFIG -> ajustes gerais
   2) properties.json -> dados dos imóveis (sem mexer no JS)
   ========================================================= */

/* =========================================================
   1) CONFIGURAÇÕES RÁPIDAS (edite aqui)
   ========================================================= */
const SITE_CONFIG = {
  whatsappNumber: "5535999260177",
  whatsappFloatShowAfterPx: 520,

  enableRevealAnimations: true,
  revealStaggerMs: 70,
  enableFaqAccordion: true,

  // JSON externo
  propertiesJsonUrl: "properties.json", // pode virar "data/properties.json" se você preferir pasta

  directBookingHintShort:
    "Reserva direta com a StayMais pode incluir brinde ou desconto (conforme disponibilidade).",
};

/* =========================================================
   Helpers (não mexer)
   ========================================================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function openWhatsApp(message) {
  const url = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatAreaLabel(area) {
  return (area || "").toString().replaceAll("-", " ");
}

function calcNights(checkin, checkout) {
  if (!checkin || !checkout) return 0;
  const a = new Date(checkin);
  const b = new Date(checkout);
  const diff = (b - a) / (1000 * 60 * 60 * 24);
  return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : 0;
}

/* =========================================================
   2) Reveal animations (funciona com conteúdo dinâmico)
   ========================================================= */
let _revealObserver = null;

function initReveal(scope = document) {
  if (!SITE_CONFIG.enableRevealAnimations) return;

  const revealEls = scope.querySelectorAll(".reveal:not(.show)");
  if (!revealEls.length) return;

  if (!_revealObserver) {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          _revealObserver.unobserve(entry.target); // performance
        }
      });
    }, { threshold: 0.12 });
  }

  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * (SITE_CONFIG.revealStaggerMs || 70), 420)}ms`;
    _revealObserver.observe(el);
  });
}

/* =========================================================
   3) Menu mobile
   ========================================================= */
(() => {
  const burger = $("#burger");
  const links = $("#navLinks");
  if (!burger || !links) return;

  burger.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
})();

/* =========================================================
   4) FAQ accordion
   ========================================================= */
(() => {
  if (!SITE_CONFIG.enableFaqAccordion) return;
  const btns = $$(".faq-q");
  if (!btns.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      if (!item) return;

      const open = item.classList.contains("open");
      $$(".faq-item.open").forEach((i) => i.classList.remove("open"));
      if (!open) item.classList.add("open");
    });
  });
})();

/* =========================================================
   5) WhatsApp float
   ========================================================= */
(() => {
  const floatBtn = $("#whatsFloat");
  if (!floatBtn) return;

  floatBtn.setAttribute("href", `https://wa.me/${SITE_CONFIG.whatsappNumber}`);

  function toggleFloat() {
    floatBtn.classList.toggle("show", window.scrollY > SITE_CONFIG.whatsappFloatShowAfterPx);
  }
  window.addEventListener("scroll", toggleFloat, { passive: true });
  toggleFloat();
})();

/* =========================================================
   6) Galerias (slider) - inicializador genérico
   ========================================================= */
function initGalleries(scope = document) {
  const galleries = scope.querySelectorAll("[data-gallery]");
  galleries.forEach((gallery) => {
    const track = gallery.querySelector(".gallery-track");
    const slides = gallery.querySelectorAll(".gallery-slide");
    const prev = gallery.querySelector(".gallery-btn.prev");
    const next = gallery.querySelector(".gallery-btn.next");
    const dots = gallery.querySelectorAll(".dot");
    if (!track || slides.length <= 1) return;

    let index = 0;

    function render() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("active", i === index));
    }

    prev?.addEventListener("click", (e) => {
      e.preventDefault();
      index = (index - 1 + slides.length) % slides.length;
      render();
    });

    next?.addEventListener("click", (e) => {
      e.preventDefault();
      index = (index + 1) % slides.length;
      render();
    });

    dots.forEach((d, i) => {
      d.addEventListener("click", (e) => {
        e.preventDefault();
        index = i;
        render();
      });
    });

    render();
  });
}

/* =========================================================
   7) Carregar properties.json (fonte única de dados)
   ========================================================= */
async function loadProperties() {
  try {
    const url = new URL(SITE_CONFIG.propertiesJsonUrl, document.baseURI).toString();
    console.log("📦 Carregando JSON em:", url);

    const res = await fetch(url, { cache: "no-store" });
    console.log("📡 Status JSON:", res.status);

    if (!res.ok) throw new Error(`Falha ao carregar JSON: ${res.status}`);

    const data = await res.json();
    console.log("✅ JSON carregado. Total de imóveis:", Object.keys(data || {}).length);

    if (!data || typeof data !== "object") throw new Error("JSON inválido (não é objeto).");
    return data;
  } catch (err) {
    console.error("❌ Erro ao carregar properties.json:", err);
    return null;
  }
}


/* =========================================================
   8) Render do Portfólio (usa dados do JSON)
   ========================================================= */
function renderPortfolio(PROPERTIES) {
  const list = $("#propertiesList");
  console.log("✅ propertiesList:", list);

  if (!list) return;

  // Se não veio nada, mostra mensagem amigável
  const ids = Object.keys(PROPERTIES || {});
  if (!ids.length) {
    list.innerHTML = `<p class="sub">Nenhum imóvel disponível no momento.</p>`;
    return;
  }

  const html = Object.entries(PROPERTIES).map(([id, p]) => {
    const photos = Array.isArray(p.photos) ? p.photos : [];
    const dots = photos.map((_, i) => `<span class="dot ${i === 0 ? "active" : ""}"></span>`).join("");
    const slides = photos.map((src, i) => `
      <div class="gallery-slide">
        <img src="${src}" alt="${p.name || "Hospedagem"} - foto ${i + 1}" loading="lazy" decoding="async">
      </div>
    `).join("");

    const badges = (p.badges || []).map((b) =>
      `<span class="badge-mini ${b.hot ? "hot" : ""}">${b.text}</span>`
    ).join("");

    const rules = (p.rules || []).map((r) => `<li>${r}</li>`).join("");

    return `
      <article class="prop reveal" data-name="${p.name || ""}" data-city="${p.city || ""}" data-area="${p.area || ""}">
        <div class="gallery" data-gallery>
          <div class="gallery-track">${slides}</div>
          <button class="gallery-btn prev" aria-label="Foto anterior">‹</button>
          <button class="gallery-btn next" aria-label="Próxima foto">›</button>
          <div class="gallery-dots" aria-hidden="true">${dots}</div>
        </div>

        <div class="prop-body">
          <h3 class="prop-title">${p.name || "Hospedagem"}</h3>
          <p class="prop-meta">${p.city || ""} • ${(p.areaLabel || formatAreaLabel(p.area) || "")}</p>

          <div class="badge-set">${badges}</div>

          <p class="prop-desc">${p.description || ""}</p>

          <div class="rules">
            <h4>Regras e informações</h4>
            <ul>${rules}</ul>
          </div>

          <div class="book-hint">${SITE_CONFIG.directBookingHintShort}</div>

          <div class="prop-actions">
            <a class="btn" target="_blank" href="${p.airbnbUrl || "#"}">Ver no Airbnb</a>
            <a class="btn orange" href="reserva.html?id=${encodeURIComponent(id)}">Reservar direto</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  list.innerHTML = html;
  list.style.border = "2px solid red";
  list.style.minHeight = "200px";

  console.log("✅ Portfólio renderizado. props:", document.querySelectorAll(".prop").length);
  


  // Ativa componentes do conteúdo recém-criado
  initGalleries(list);
  initReveal(list);

  // Busca/Filtro (se existir na página)
  const chips = $$(".chip");
  const searchInput = $("#propSearch");
  const props = $$(".prop");

  function applyFilters() {
    const activeChip = $(".chip.active");
    const filter = activeChip ? activeChip.dataset.filter : "todos";
    const query = (searchInput?.value || "").trim().toLowerCase();

    props.forEach((card) => {
      const city = (card.dataset.city || "").toLowerCase();
      const area = (card.dataset.area || "").toLowerCase();
      const name = (card.dataset.name || "").toLowerCase();

      const matchesChip = (filter === "todos") || (area === filter);
      const matchesSearch = !query || name.includes(query) || city.includes(query) || area.includes(query);

      card.style.display = (matchesChip && matchesSearch) ? "" : "none";
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });
  });

  searchInput?.addEventListener("input", applyFilters);
  applyFilters();
}

/* =========================================================
   9) Render da Reserva (usa dados do JSON)
   ========================================================= */
function renderReserva(PROPERTIES) {
  const titleEl = $("#reserveTitle");
  const galleryHost = $("#reserveGalleryHost");
  const form = $("#reserveForm");
  if (!titleEl || !galleryHost || !form) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const p = id ? PROPERTIES?.[id] : null;

  if (!p) {
    titleEl.textContent = "Reserva";
    galleryHost.innerHTML = `<p class="sub">Imóvel não encontrado. Volte ao portfólio e tente novamente.</p>`;
    return;
  }

  titleEl.textContent = p.name || "Reserva";

  const photos = Array.isArray(p.photos) ? p.photos : [];
  const slides = photos.map((src, i) => `
    <div class="gallery-slide">
      <img src="${src}" alt="${p.name || "Hospedagem"} - foto ${i + 1}" loading="lazy" decoding="async">
    </div>
  `).join("");

  const dots = photos.map((_, i) => `<span class="dot ${i === 0 ? "active" : ""}"></span>`).join("");

  galleryHost.innerHTML = `
    <div class="gallery reserve-gallery reveal" data-gallery>
      <div class="gallery-track">${slides}</div>
      <button class="gallery-btn prev" aria-label="Foto anterior">‹</button>
      <button class="gallery-btn next" aria-label="Próxima foto">›</button>
      <div class="gallery-dots" aria-hidden="true">${dots}</div>
    </div>
    <div class="book-hint" style="margin-top:12px;">
      ${SITE_CONFIG.directBookingHintShort}
    </div>
  `;

  initGalleries(galleryHost);
  initReveal(galleryHost);

  // diárias
  const inEl = $("#checkin");
  const outEl = $("#checkout");
  const nightsEl = $("#nightsCount");

  function updateNights() {
    const n = calcNights(inEl.value, outEl.value);
    nightsEl.textContent = n > 0 ? `${n} diária${n > 1 ? "s" : ""}` : "Selecione as datas";
  }

  inEl?.addEventListener("change", updateNights);
  outEl?.addEventListener("change", updateNights);

  // Envio: abre WhatsApp
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const nome = (fd.get("Nome") || "").toString().trim();
    const telefone = (fd.get("Telefone") || "").toString().trim();
    const email = (fd.get("Email") || "").toString().trim();
    const hospedes = (fd.get("Hóspedes") || "").toString().trim();
    const checkin = (fd.get("Check-in") || "").toString().trim();
    const checkout = (fd.get("Check-out") || "").toString().trim();

    const nights = calcNights(checkin, checkout);
    if (checkin && checkout && nights <= 0) {
      alert("Check-out precisa ser depois do Check-in.");
      return;
    }

    const msg =
`Olá! Tudo bem?

Quero reservar diretamente com a StayMais.

• Imóvel: ${p.name || "-"}
• Nome: ${nome}
• Telefone/WhatsApp: ${telefone}
• E-mail: ${email}
• Hóspedes: ${hospedes}
• Check-in: ${checkin}
• Check-out: ${checkout}
• Diárias: ${nights > 0 ? nights : "-"}

Obs: Tenho interesse na reserva direta (possível brinde/desconto, conforme disponibilidade).

Pode me confirmar disponibilidade e valores, por favor?`;

    openWhatsApp(msg);
  });

  updateNights();
}

/* =========================================================
   10) Form Avaliação (FormSubmit) - mantém seu fluxo atual
   ========================================================= */
function bindLeadForm() {
  const form = $("#leadForm");
  const msgEl = $("#leadMsg");
  if (!form) return;

  form.addEventListener("submit", () => {
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://formsubmit.co/staymaisreservas@gmail.com");

    const fd = new FormData(form);

    const nome = (fd.get("Nome") || "").toString().trim();
    const whatsCliente = (fd.get("WhatsApp") || "").toString().trim();
    const cidade = (fd.get("Cidade") || "").toString().trim();
    const bairro = (fd.get("Bairro") || "").toString().trim();
    const tipo = (fd.get("Tipo") || "").toString().trim();
    const quartos = (fd.get("Quartos") || "").toString().trim();
    const status = (fd.get("Status no Airbnb") || "").toString().trim();
    const link = (fd.get("Link do anúncio") || "").toString().trim();
    const obs = (fd.get("Observações") || "").toString().trim();

    const waMsg =
`Olá! Tudo bem?

Gostaria de solicitar uma avaliação do meu imóvel para gestão com a StayMais.

• Nome: ${nome}
• Meu WhatsApp: ${whatsCliente}
• Cidade: ${cidade}
• Bairro: ${bairro || "-"}
• Tipo: ${tipo}
• Quartos: ${quartos}
• Status: ${status}
• Link do anúncio: ${link || "-"}
• Observações: ${obs || "-"}

Obrigado(a)!`;

    openWhatsApp(waMsg);
    if (msgEl) msgEl.textContent = "Enviando por e-mail e abrindo WhatsApp com a mensagem pronta…";
  });
}

/* =========================================================
   11) Bootstrap do site (carrega JSON e renderiza páginas)
   ========================================================= */
(async () => {
  // animações iniciais do que já existe em tela
  console.log("📄 Página atual:", location.pathname);
  console.log("🧩 Tem #propertiesList?", !!document.getElementById("propertiesList"));

  initReveal(document);

  // forms
  bindLeadForm();

  // Carrega imóveis do JSON
  const PROPERTIES = await loadProperties();

  // Se falhar, mostra fallback (e não quebra o resto do site)
  if (!PROPERTIES) {
    const list = $("#propertiesList");
    if (list) list.innerHTML = `<p class="sub">Não foi possível carregar os imóveis agora. Tente novamente em instantes.</p>`;
    const host = $("#reserveGalleryHost");
    if (host) host.innerHTML = `<p class="sub">Não foi possível carregar os dados do imóvel. Volte ao portfólio e tente novamente.</p>`;
    return;
  }

  // Renderiza onde fizer sentido (cada função já verifica se existe)
  renderPortfolio(PROPERTIES);
  renderReserva(PROPERTIES);
})();
