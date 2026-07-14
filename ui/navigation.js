function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(item => item.classList.remove("active"));
      views.forEach(view => view.classList.remove("active-view"));

      button.classList.add("active");

      const targetView = document.getElementById(button.dataset.view);
      if (targetView) {
        targetView.classList.add("active-view");
      }
    });
  });
}

window.initNavigation = initNavigation;
