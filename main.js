document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".mood-track");
  const leftBtn = document.querySelector(".nav-btn.left");
  const rightBtn = document.querySelector(".nav-btn.right");

  if (!track || !leftBtn || !rightBtn) {
    console.log("Mood navigation elements not found:", { track, leftBtn, rightBtn });
    return;
  }

  console.log("Mood navigation buttons found and initialized");

  leftBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Left button clicked");
    track.scrollBy({ left: -260, behavior: "smooth" });
  });

  rightBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Right button clicked");
    track.scrollBy({ left: 260, behavior: "smooth" });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".nav-btn[data-section]");
  const sections = document.querySelectorAll(".section");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      button.classList.add("active");
      const target = document.getElementById(button.dataset.section);
      if (target) target.classList.add("active");
    });
  });
});

