/* =========================================================
   STAYMAIS - SCRIPT PRINCIPAL (MANUTENÇÃO FÁCIL)
   =========================================================
   Onde editar:
   1) SITE_CONFIG -> ajustes gerais
   2) PROPERTIES  -> dados dos imóveis (nome, fotos, regras, badges, link)
   ========================================================= */

/* =========================================================
   1) CONFIGURAÇÕES RÁPIDAS (edite aqui)
   ========================================================= */
const SITE_CONFIG = {
  whatsappNumber: "5535999260177",          // DDI+DDD+Número (sem espaços)
  whatsappFloatShowAfterPx: 520,

  enableRevealAnimations: true,
  revealStaggerMs: 70,                      // animação “em cascata”
  enableFaqAccordion: true,

  // Texto discreto para incentivar reserva direta
  directBookingHintShort: "Reserva direta com a StayMais pode incluir brinde ou desconto (conforme disponibilidade).",
};

/* =========================================================
   2) DADOS DOS IMÓVEIS (edite aqui)
   =========================================================
   Dica:
   - fotos: coloque URLs reais (pode ser do seu próprio site depois)
   - badges: use termos curtos
   - rules: frases curtas e claras
   - airbnbUrl: mantém “Ver no Airbnb”
   ========================================================= */
const PROPERTIES = {
  imovel1: {
    name: "Imóvel 1",
    city: "Campos do Jordão",
    area: "capivari",
    areaLabel: "Capivari",
    airbnbUrl: "https://www.airbnb.com.br/rooms/1489778972017530668",
    badges: [
      { text: "Mais reservado", hot: true },
      { text: "Vista" },
      { text: "Conforto" },
    ],
    rules: [
      "Check-in: a combinar",
      "Check-out: a combinar",
      "Pet: consultar",
      "Vaga: consultar",
      "Silêncio: após 22h",
    ],
    description:
      "Hospedagem com foco em conforto e praticidade, ideal para casais ou pequenas famílias.",
    photos: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=60",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1600&q=60",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=60",
    ],
  },

  imovel2: {
    name: "Imóvel 2",
    city: "Campos do Jordão",
    area: "alto-da-boa-vista",
    areaLabel: "Alto da Boa Vista",
    airbnbUrl: "https://www.airbnb.com.br/rooms/1366703907415936831",
    badges: [
      { text: "Lareira" },
      { text: "Família" },
      { text: "Tranquilo" },
    ],
    rules: [
      "Check-in: a combinar",
      "Check-out: a combinar",
      "Pet: não permitido",
      "Vaga: 1 vaga",
      "Sem festas",
    ],
    description:
      "Ambiente espaçoso, com estrutura completa para estadias confortáveis em qualquer época do ano.",
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=60",
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=60",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=60",
    ],
  },

  imovel3: {
    name: "Imóvel 3",
    city: "Campos do Jordão",
    area: "vila-inglesa",
    areaLabel: "Vila Inglesa",
    airbnbUrl: "https://www.airbnb.com.br/rooms/1441574411572251909",
    badges: [
      { text: "Casal" },
      { text: "Aconchegante" },
      { text: "Localização" },
    ],
    rules: [
      "Check-in: a combinar",
      "Check-out: a combinar",
      "Pet: consultar",
      "Vaga: consultar",
      "Proibido fumar",
    ],
    description:
      "Opção perfeita para quem quer tranquilidade, conforto e fácil acesso às principais regiões.",
    photos: [
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=60",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=60",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=60",
    ],
  },
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
  return area.replaceAll("-", " ");
}

function calcNights(checkin, checkout) {
  if (!checkin || !checkout) return 0;
  const a = new Date(checkin);
  const b = new Date(checkout);
  const diff = (b - a) / (1000 * 60 * 60 * 24);
  return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : 0;
}

/* =========================================================
   Menu mobile
   ========================================================= */
(() => {
  const burger = $("#burger");
  const links = $("#navLinks");
  if (!burger || !links) return;

  burger.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
})();

/* =========================================================
   Reveal animations (suave + em cascata)
   ========================================================= */
(() => {
  if (!SITE_CONFIG.enableRevealAnimations) return;
  const revealEls = $$(".reveal");
  if (!revealEls.length) return;

  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * SITE_CONFIG.revealStaggerMs, 420)}ms`;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => io.observe(el));
})();

/* =========================================================
   FAQ accordion
   ========================================================= */
(() => {
  if (!SITE_CONFIG.enableFaqAccordion) return;
  const btns = $$(".faq-q");
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      if (!item) return;

      const open = item.classList.contains("open");
      $$(".faq-item.open").forEach(i => i.classList.remove("open"));
      if (!open) item.classList.add("open");
    });
  });
})();

/* =========================================================
   WhatsApp float
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
   Galerias (slider) - inicializador genérico
   =========================================================
   Como usar no HTML:
   - Container: <div class="gallery" data-gallery>
   - Track: <div class="gallery-track"> ...slides... </div>
   - Botões: .gallery-btn.prev / .gallery-btn.next
   - Dots: .gallery-dots com filhos .dot
   ========================================================= */
function initGalleries(scope=document) {
  const galleries = scope.querySelectorAll("[data-gallery]");
  galleries.forEach(gallery => {
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
   PORTFÓLIO - render automático dos cards
   =========================================================
   Necessário no portfolio.html:
   - <div id="propertiesList"></div>
   ========================================================= */
(() => {
  const list = $("#propertiesList");
  if (!list) return;

  // Renderiza todos os imóveis
  const html = Object.entries(PROPERTIES).map(([id, p]) => {
    const dots = p.photos.map((_, i) => `<span class="dot ${i===0 ? "active":""}"></span>`).join("");
    const slides = p.photos.map((src, i) => `
      <div class="gallery-slide">
        <img src="${src}" alt="${p.name} - foto ${i+1}" loading="lazy" decoding="async">
      </div>
    `).join("");

    const badges = (p.badges || []).map(b =>
      `<span class="badge-mini ${b.hot ? "hot":""}">${b.text}</span>`
    ).join("");

    const rules = (p.rules || []).map(r => `<li>${r}</li>`).join("");

    return `
      <article class="prop reveal" data-name="${p.name}" data-city="${p.city}" data-area="${p.area}">
        <div class="gallery" data-gallery>
          <div class="gallery-track">${slides}</div>

          <button class="gallery-btn prev" aria-label="Foto anterior">‹</button>
          <button class="gallery-btn next" aria-label="Próxima foto">›</button>

          <div class="gallery-dots" aria-hidden="true">${dots}</div>
        </div>

        <div class="prop-body">
          <h3 class="prop-title">${p.name}</h3>
          <p class="prop-meta">${p.city} • ${p.areaLabel || formatAreaLabel(p.area)}</p>

          <div class="badge-set">${badges}</div>

          <p class="prop-desc">${p.description}</p>

          <div class="rules">
            <h4>Regras e informações</h4>
            <ul>${rules}</ul>
          </div>

          <!-- Incentivo discreto (não “grita”, mas vende) -->
          <div class="book-hint">${SITE_CONFIG.directBookingHintShort}</div>

          <div class="prop-actions">
            <a class="btn" target="_blank" href="${p.airbnbUrl}">Ver no Airbnb</a>
            <a class="btn orange" href="reserva.html?id=${encodeURIComponent(id)}">Reservar direto</a>
          </div>

          <!-- REVIEWS (futuro - quando liberar depoimentos)
          <div class="panel" style="margin-top:12px;">
            <p class="small"><strong>★ 4,9</strong> (128 avaliações)</p>
            <p class="small">"Lugar impecável e atendimento rápido!" — Ana</p>
          </div>
          -->
        </div>
      </article>
    `;
  }).join("");
  // depois de preencher o HTML dos cards:
  requestAnimationFrame(() => {
    document.querySelectorAll("#propertiesList .reveal")
      .forEach(el => el.classList.add("show"));
  });

  document.querySelectorAll(".reveal").forEach(el => {
  el.style.opacity = 1;
  el.style.transform = "none";
});

  list.innerHTML = html;

  // Liga slider nas galerias do portfólio
  initGalleries(document);

  // Filtro + busca
  const chips = $$(".chip");
  const searchInput = $("#propSearch");
  const props = $$(".prop");

  function applyFilters() {
    const activeChip = $(".chip.active");
    const filter = activeChip ? activeChip.dataset.filter : "todos";
    const query = (searchInput?.value || "").trim().toLowerCase();

    props.forEach(card => {
      const city = (card.dataset.city || "").toLowerCase();
      const area = (card.dataset.area || "").toLowerCase();
      const name = (card.dataset.name || "").toLowerCase();

      const matchesChip = (filter === "todos") || (area === filter);
      const matchesSearch = !query || name.includes(query) || city.includes(query) || area.includes(query);

      card.style.display = (matchesChip && matchesSearch) ? "" : "none";
    });
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });
  });

  searchInput?.addEventListener("input", applyFilters);
  applyFilters();
})();

/* =========================================================
   RESERVA - render da página com base em ?id=
   ========================================================= */
(() => {
  const titleEl = $("#reserveTitle");
  const galleryHost = $("#reserveGalleryHost");
  const form = $("#reserveForm");

  if (!titleEl || !galleryHost || !form) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const p = id ? PROPERTIES[id] : null;
  if (!p) {
    titleEl.textContent = "Reserva";
    galleryHost.innerHTML = `<p class="sub">Imóvel não encontrado. Volte ao portfólio e tente novamente.</p>`;
    return;
  }

  // Título
  titleEl.textContent = p.name;

  // Galeria (fotos do imóvel selecionado)
  const slides = p.photos.map((src, i) => `
    <div class="gallery-slide">
      <img src="${src}" alt="${p.name} - foto ${i+1}" loading="lazy" decoding="async">
    </div>
  `).join("");

  const dots = p.photos.map((_, i) => `<span class="dot ${i===0 ? "active":""}"></span>`).join("");

  galleryHost.innerHTML = `
    <div class="gallery reserve-gallery" data-gallery>
      <div class="gallery-track">${slides}</div>
      <button class="gallery-btn prev" aria-label="Foto anterior">‹</button>
      <button class="gallery-btn next" aria-label="Próxima foto">›</button>
      <div class="gallery-dots" aria-hidden="true">${dots}</div>
    </div>
    <div class="book-hint" style="margin-top:12px;">
      ${SITE_CONFIG.directBookingHintShort}
    </div>
  `;

  initGalleries(document);

  // Elementos de data/diárias
  const inEl = $("#checkin");
  const outEl = $("#checkout");
  const nightsEl = $("#nightsCount");

  function updateNights() {
    const n = calcNights(inEl.value, outEl.value);
    nightsEl.textContent = n > 0 ? `${n} diária${n>1?"s":""}` : "Selecione as datas";
  }

  inEl?.addEventListener("change", updateNights);
  outEl?.addEventListener("change", updateNights);

  // Envio: abre WhatsApp
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    const nome     = (fd.get("Nome") || "").toString().trim();
    const telefone = (fd.get("Telefone") || "").toString().trim();
    const email    = (fd.get("Email") || "").toString().trim();
    const hospedes = (fd.get("Hóspedes") || "").toString().trim();
    const checkin  = (fd.get("Check-in") || "").toString().trim();
    const checkout = (fd.get("Check-out") || "").toString().trim();

    const nights = calcNights(checkin, checkout);
    if (checkin && checkout && nights <= 0) {
      alert("Check-out precisa ser depois do Check-in.");
      return;
    }

    const msg =
`Olá! Tudo bem?

Quero reservar diretamente com a StayMais.

• Imóvel: ${p.name}
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
})();

/* =========================================================
   FORM AVALIAÇÃO (FormSubmit) - envia e-mail + abre WhatsApp
   ========================================================= */
(() => {
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
sessionStorage.setItem("staymais_last_reserve_msg", msg);

    openWhatsApp(waMsg);
    setTimeout(() => {
  window.location.href = "obrigado-reserva.html";
}, 900);

    if (msgEl) msgEl.textContent = "Enviando por e-mail e abrindo WhatsApp com a mensagem pronta…";
  });
  
})();
