/* =========================================================
   STAYMAIS - CONFIGURAÇÕES RÁPIDAS (edite aqui)
   ========================================================= */
const SITE_CONFIG = {
  whatsappNumber: "5535999260177",
  whatsappFloatShowAfterPx: 520,

  enableRevealAnimations: true,
  revealStaggerMs: 70, // animação “um por um”
  enableFaqAccordion: true,

  // Formulários
  enableLeadFormWhatsappAfterEmail: true
};

/* Helpers */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* WhatsApp builder */
function openWhatsApp(message) {
  const url = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* Menu mobile */
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

/* Reveal animations (com stagger) */
(() => {
  if (!SITE_CONFIG.enableRevealAnimations) return;
  const revealEls = $$(".reveal");
  if (!revealEls.length) return;

  // adiciona delay em cascata
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

/* FAQ accordion */
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

/* WhatsApp float */
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

/* Portfólio: filtro + busca */
(() => {
  const chips = $$(".chip");
  const searchInput = $("#propSearch");
  const props = $$(".prop");
  if (!props.length) return;

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

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  applyFilters();
})();

/* Form Avaliação (envia e-mail + abre WhatsApp) */
(() => {
  const form = $("#leadForm");
  const msgEl = $("#leadMsg");
  if (!form) return;

  form.addEventListener("submit", () => {
    // Garantia
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://formsubmit.co/staymaisreservas@gmail.com");

    if (!SITE_CONFIG.enableLeadFormWhatsappAfterEmail) return;

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
})();

/* =========================================================
   FORM RESERVA (capta dados e abre WhatsApp)
   =========================================================
   Regras:
   - NÃO envia e-mail
   - Apenas abre o WhatsApp com mensagem pronta
   - Valida datas (check-out > check-in) para evitar erro bobo
   ========================================================= */
(() => {
  const form = document.querySelector("#reserveForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    // Coleta dos campos
    const imovel   = (fd.get("Imóvel") || "").toString().trim();
    const nome     = (fd.get("Nome") || "").toString().trim();
    const whats    = (fd.get("WhatsApp") || "").toString().trim();
    const email    = (fd.get("Email") || "").toString().trim();
    const checkin  = (fd.get("Check-in") || "").toString().trim();
    const checkout = (fd.get("Check-out") || "").toString().trim();
    const hospedes = (fd.get("Hóspedes") || "").toString().trim();
    const objetivo = (fd.get("Objetivo") || "").toString().trim();
    const obs      = (fd.get("Observações") || "").toString().trim();

    // Validação simples de datas (evita enviar com data invertida)
    if (checkin && checkout && checkout <= checkin) {
      alert("A data de Check-out precisa ser depois do Check-in.");
      return;
    }

    // Montagem da mensagem para WhatsApp (profissional, direta e completa)
    const msg =
`Olá! Tudo bem?

Quero solicitar ${objetivo.toLowerCase()} para uma estadia com a StayMais.

• Imóvel: ${imovel}
• Nome: ${nome}
• WhatsApp: ${whats}
• E-mail: ${email}
• Check-in: ${checkin}
• Check-out: ${checkout}
• Hóspedes: ${hospedes}
• Observações: ${obs || "-"}

Pode me passar disponibilidade e valores, por favor?`;

    // Abre WhatsApp em nova aba
    const url = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
})();
