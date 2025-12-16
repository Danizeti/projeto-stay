/* =========================================================
   STAYMAIS - SCRIPT PRINCIPAL (MANUTENÇÃO FÁCIL)
   =========================================================
   Este arquivo controla:
   - Menu mobile
   - Animações (reveal)
   - Botão flutuante do WhatsApp
   - Portfólio (carrega imóveis de properties.json)
   - Reserva (pega id do imóvel, monta galeria, envia WhatsApp, redirect)
   - Form de avaliação (salva no Google Sheets + abre WhatsApp + (opcional) FormSubmit)

   Onde editar:
   1) SITE_CONFIG -> ajustes gerais do site
   2) properties.json -> dados dos imóveis (nome, fotos, regras, badges, link)
   3) Apps Script -> valida e salva no Sheets (token/origens/limites)
   ========================================================= */

/* =========================================================
   1) CONFIGURAÇÕES RÁPIDAS (edite aqui)
   ========================================================= */
const SITE_CONFIG = {
  // Contato
  whatsappNumber: "5535999260177",

  // UI
  whatsappFloatShowAfterPx: 520,
  enableRevealAnimations: true,
  revealStaggerMs: 70,
  enableFaqAccordion: true,

  // Dados (JSON externo)
  propertiesJsonUrl: "./properties.json", // use "/properties.json" para funcionar em qualquer pasta

  // Google Sheets (Web App do Apps Script)
  googleSheetsWebhook: "https://script.google.com/macros/s/AKfycbzApu0HECitmFp6f65LSQ8sEM6JT63uxyaNqDJ7MoEBG3tHKh_HRddAVY-leG4sSS8Q/exec",
  googleSheetsToken: "STAYMAIS_TOKEN_SUPER_SECRETO_AKfycbzApu0HECitmFp6f65LSQ8sEM6JT63uxyaNqDJ7MoEBG3tHKh_HRddAVY-leG4sSS8Q",


  // Mensagem discreta de incentivo à reserva direta
  directBookingHintShort:
    "Reserva direta com a StayMais pode incluir brinde ou desconto (conforme disponibilidade).",

  // Segurança/anti-spam (client-side)
  enableHoneypot: true,           // exige input hidden name="hp" nos forms
  blockDoubleSubmit: true,        // trava clique duplo
  sheetsTimeoutMs: 2500           // timeout do POST pro Sheets
};


/* =========================================================
   2) HELPERS (não mexer)
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
   3) REVEAL ANIMATIONS (funciona com conteúdo dinâmico)
   ---------------------------------------------------------
   - Elementos com classe .reveal começam "apagados" no CSS
   - Quando entram na tela: adiciona .show
   - Chamamos initReveal() novamente após renderizar via JS
   ========================================================= */
let _revealObserver = null;

function initReveal(scope = document) {
  if (!SITE_CONFIG.enableRevealAnimations) return;

  const revealEls = scope.querySelectorAll(".reveal:not(.show)");
  if (!revealEls.length) return;

  // Cria 1 observer e reutiliza (performance)
  if (!_revealObserver) {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          _revealObserver.unobserve(entry.target); // evita reprocessar
        }
      });
    }, { threshold: 0.12 });
  }

  // Efeito em cascata (stagger)
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * (SITE_CONFIG.revealStaggerMs || 70), 420)}ms`;
    _revealObserver.observe(el);
  });
}


/* =========================================================
   4) MENU MOBILE
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
   5) FAQ ACCORDION
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
   6) WHATSAPP FLOAT
   ========================================================= */
(() => {
  const floatBtn = $("#whatsFloat");
  if (!floatBtn) return;

  // garante o número correto no botão flutuante
  floatBtn.setAttribute("href", `https://wa.me/${SITE_CONFIG.whatsappNumber}`);

  function toggleFloat() {
    floatBtn.classList.toggle("show", window.scrollY > SITE_CONFIG.whatsappFloatShowAfterPx);
  }

  window.addEventListener("scroll", toggleFloat, { passive: true });
  toggleFloat();
})();


/* =========================================================
   7) GALERIAS (slider leve, sem biblioteca)
   ---------------------------------------------------------
   Estrutura esperada:
   - container: [data-gallery]
   - track: .gallery-track
   - slides: .gallery-slide
   - botões: .gallery-btn.prev / .gallery-btn.next
   - dots: .dot
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
   8) GOOGLE SHEETS - envio seguro (timeout + keepalive)
   ---------------------------------------------------------
   Requer:
   - Web App do Apps Script publicado
   - TOKEN igual no site e no Apps Script
   - Apps Script com allowlist/rate-limit/honeypot
   ========================================================= */
async function sendToSheets(type, data) {
  try {
    if (!SITE_CONFIG.googleSheetsWebhook) return { ok: false, skipped: true };

    // Honeypot: se vier preenchido, nem tenta enviar (provável bot)
    if (SITE_CONFIG.enableHoneypot && data && typeof data.hp === "string" && data.hp.trim() !== "") {
      console.warn("Honeypot preenchido - possível bot. Bloqueando envio.");
      return { ok: false, error: "spam" };
    }

    const payload = {
      token: SITE_CONFIG.googleSheetsToken,
      type,
      data,
      meta: {
        origem: location.origin,
        path: location.pathname,
        userAgent: navigator.userAgent,
        ts: Date.now()
      }
    };

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), SITE_CONFIG.sheetsTimeoutMs || 2500);

    const res = await fetch(SITE_CONFIG.googleSheetsWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: controller.signal
    });

    clearTimeout(t);

    const json = await res.json().catch(() => ({}));
    return json;

  } catch (e) {
    console.error("Erro ao enviar para Sheets:", e);
    return { ok: false, error: String(e) };
  }
}


/* =========================================================
   9) CARREGAR PROPERTIES.JSON (fonte única de imóveis)
   ========================================================= */
async function loadProperties() {
  try {
    const url = new URL("properties.json", window.location.href).toString();
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
   10) PORTFÓLIO - render automático dos cards
   ---------------------------------------------------------
   Necessário no portfolio.html:
   - <div id="propertiesList"></div>
   ========================================================= */
function renderPortfolio(PROPERTIES) {
  const list = $("#propertiesList");
  if (!list) return;

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

    const badges = (p.badges || []).map(b =>
      `<span class="badge-mini ${b.hot ? "hot" : ""}">${b.text}</span>`
    ).join("");

    const rules = (p.rules || []).map(r => `<li>${r}</li>`).join("");

    return `
      <article class="prop reveal" data-name="${(p.name || "")}" data-city="${(p.city || "")}" data-area="${(p.area || "")}">
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

  // Renderiza
  list.innerHTML = html;

  // Ativa sliders e animações só dentro do container recém-criado
  initGalleries(list);
  initReveal(list);

  // Busca e filtro (se existir)
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
}


/* =========================================================
   11) RESERVA - render por ?id=
   ---------------------------------------------------------
   Necessário no reserva.html:
   - #reserveTitle
   - #reserveGalleryHost
   - #reserveForm
   - #checkin #checkout #nightsCount
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

  // Galeria do imóvel selecionado
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

  // Campos de data/diárias
  const inEl = $("#checkin");
  const outEl = $("#checkout");
  const nightsEl = $("#nightsCount");

  function updateNights() {
    const n = calcNights(inEl?.value, outEl?.value);
    if (nightsEl) nightsEl.textContent = n > 0 ? `${n} diária${n > 1 ? "s" : ""}` : "Selecione as datas";
  }

  inEl?.addEventListener("change", updateNights);
  outEl?.addEventListener("change", updateNights);

  // Submit da reserva: salva no Sheets, abre Whats, redireciona
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Bloqueia clique duplo
    const btn = form.querySelector('button[type="submit"]');
    if (SITE_CONFIG.blockDoubleSubmit && btn) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
    }

    const fd = new FormData(form);

    // Honeypot (campo escondido)
    const hp = (fd.get("hp") || "").toString();

    const nome     = (fd.get("Nome") || "").toString().trim();
    const telefone = (fd.get("Telefone") || "").toString().trim();
    const email    = (fd.get("Email") || "").toString().trim();
    const hospedes = (fd.get("Hóspedes") || "").toString().trim();
    const checkin  = (fd.get("Check-in") || "").toString().trim();
    const checkout = (fd.get("Check-out") || "").toString().trim();

    const nights = calcNights(checkin, checkout);
    if (checkin && checkout && nights <= 0) {
      alert("Check-out precisa ser depois do Check-in.");
      if (btn) { btn.disabled = false; btn.textContent = "Solicitar reserva"; }
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

    // Salva mensagem para o botão "Abrir WhatsApp" na página de obrigado
    sessionStorage.setItem("staymais_last_reserve_msg", msg);

    // Salva no Google Sheets (não bloqueia conversão, mas tenta com robustez)
    await sendToSheets("reserva", {
      hp,
      imovelId: id,
      imovelNome: p.name || "",
      nome,
      telefone,
      email,
      hospedes,
      checkin,
      checkout,
      diarias: nights > 0 ? String(nights) : ""
    });

    // Converte: abre WhatsApp
    openWhatsApp(msg);

    // Redireciona para a página de agradecimento
    setTimeout(() => {
      window.location.href = "obrigado-reserva.html";
    }, 900);
  });

  updateNights();
}


/* =========================================================
   12) FORM AVALIAÇÃO (salva no Sheets + abre WhatsApp)
   ---------------------------------------------------------
   Necessário no formulario.html:
   - <form id="leadForm"> ... </form>
   - (opcional) <div id="leadMsg"></div>
   - (recomendado) input honeypot name="hp"
   ========================================================= */
function bindLeadForm() {
  const form = $("#leadForm");
  if (!form) return;

  form.addEventListener("submit", async () => {
    // Bloqueia clique duplo
    const btn = form.querySelector('button[type="submit"]');
    if (SITE_CONFIG.blockDoubleSubmit && btn) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
    }

    const fd = new FormData(form);

    // Honeypot
    const hp = (fd.get("hp") || "").toString();

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

    // Salva no Sheets (lead interno)
    await sendToSheets("avaliacao", {
      hp,
      nome,
      whatsapp: whatsCliente,
      cidade,
      bairro,
      tipo,
      quartos,
      statusAirbnb: status,
      linkAnuncio: link,
      observacoes: obs
    });

    // Abre WhatsApp com mensagem pronta
    openWhatsApp(waMsg);

    const msgEl = $("#leadMsg");
    if (msgEl) msgEl.textContent = "Solicitação registrada. Abrindo WhatsApp com a mensagem pronta…";

    // (Opcional) Se você ainda usa FormSubmit para e-mail:
    // - deixe o action/method no HTML
    // - aqui NÃO damos preventDefault, então o e-mail seguirá
  });
}


/* =========================================================
   13) BOOTSTRAP (inicialização geral)
   ---------------------------------------------------------
   - initReveal do conteúdo inicial
   - bind do formulário
   - carrega JSON e renderiza páginas que existirem
   ========================================================= */
(async () => {
  initReveal(document);
  bindLeadForm();

  const PROPERTIES = await loadProperties();

  // Se falhar, não quebra o site inteiro — só mostra mensagem amigável
  if (!PROPERTIES) {
    const list = $("#propertiesList");
    if (list) list.innerHTML = `<p class="sub">Não foi possível carregar os imóveis agora. Tente novamente em instantes.</p>`;

    const host = $("#reserveGalleryHost");
    if (host) host.innerHTML = `<p class="sub">Não foi possível carregar os dados do imóvel. Volte ao portfólio e tente novamente.</p>`;
    return;
  }

  // Renderiza onde fizer sentido (as funções já checam se os IDs existem)
  renderPortfolio(PROPERTIES);
  renderReserva(PROPERTIES);
})();
