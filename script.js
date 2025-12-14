/* =========================================================
   STAYMAIS - CONFIGURAÇÕES RÁPIDAS (edite aqui)
   ========================================================= */
const SITE_CONFIG = {
  whatsappNumber: "5535999260177", // DDI+DDD+Número (sem espaços)
  whatsappFloatShowAfterPx: 500,
  enableRevealAnimations: true,
  enableFaqAccordion: true,

  // Form
  enableLeadFormWhatsappAfterEmail: true
};

/* =========================================================
   Helpers (não mexe)
   ========================================================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

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
   Reveal animations
   ========================================================= */
(() => {
  if (!SITE_CONFIG.enableRevealAnimations) return;
  const revealEls = $$(".reveal");
  if (!revealEls.length) return;

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

  // garante número correto no botão flutuante
  floatBtn.setAttribute("href", `https://wa.me/${SITE_CONFIG.whatsappNumber}`);

  function toggleFloat() {
    floatBtn.classList.toggle("show", window.scrollY > SITE_CONFIG.whatsappFloatShowAfterPx);
  }
  window.addEventListener("scroll", toggleFloat);
  toggleFloat();
})();

/* =========================================================
   Portfólio: filtro + busca (só roda se existir)
   ========================================================= */
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

/* =========================================================
   Lead form (1 botão): envia e-mail e abre WhatsApp
   ========================================================= */
(() => {
  const form = $("#leadForm");
  const msgEl = $("#leadMsg");
  if (!form) return;

  form.addEventListener("submit", () => {
    // GARANTIA: sempre POST no FormSubmit
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://formsubmit.co/staymaisreservas@gmail.com");

    if (SITE_CONFIG.enableLeadFormWhatsappAfterEmail) {
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

Fico à disposição para encaminhar mais informações e fotos, se necessário.
Obrigado(a)!`;

      window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(waMsg)}`, "_blank");
      if (msgEl) msgEl.textContent = "Enviando por e-mail e abrindo WhatsApp com a mensagem pronta…";
    }
  });
})();
