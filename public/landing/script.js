/**
 * DOUTOR AGENDA - STANDALONE SCRIPT
 * Vanilla JS para interatividade leve da Landing Page
 */

document.addEventListener("DOMContentLoaded", () => {
  // Accordion do FAQ
  const accordionItems = document.querySelectorAll(".lp-accordion-item");

  accordionItems.forEach((item) => {
    const trigger = item.querySelector(".lp-accordion-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Fecha todos os outros itens
      accordionItems.forEach((other) => {
        other.classList.remove("active");
      });

      // Se não estava ativo, abre
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });

  // Rolagem suave para links de âncora
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (targetId && targetId !== "#") {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });

  // Ano dinâmico no rodapé
  const yearElement = document.getElementById("lp-current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});
