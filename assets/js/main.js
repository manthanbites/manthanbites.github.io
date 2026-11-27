(() => {
  "use strict";

  /* MOBILE NAVIGATION */

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";

      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute(
        "aria-label",
        open ? "Open navigation" : "Close navigation"
      );

      nav.classList.toggle("is-open", !open);
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
        nav.classList.remove("is-open");
      });
    });
  }

  /* CURRENT YEAR */

  const year = document.querySelector("#year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  /* COPY ARTICLE LINK */

  const copyButton = document.querySelector(".share-copy");
  const copyMessage = document.querySelector(".share-message");

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const articleUrl = window.location.href.split("#")[0];

      try {
        await navigator.clipboard.writeText(articleUrl);

        copyButton.textContent = "Link Copied!";
        if (copyMessage) {
          copyMessage.textContent = "Article link copy ho gaya hai.";
        }
      } catch (error) {
        /* Fallback for browsers where Clipboard API is unavailable */

        const textArea = document.createElement("textarea");
        textArea.value = articleUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.select();

        try {
          document.execCommand("copy");
          copyButton.textContent = "Link Copied!";

          if (copyMessage) {
            copyMessage.textContent = "Article link copy ho gaya hai.";
          }
        } catch (copyError) {
          if (copyMessage) {
            copyMessage.textContent =
              "Link copy nahi ho paya. Browser se page URL copy karein.";
          }
        }

        textArea.remove();
      }

      window.setTimeout(() => {
        copyButton.textContent = "Copy Link";
      }, 2500);
    });
  }

  /* MOBILE NATIVE SHARE */

  const nativeShareButton = document.querySelector(".share-native");

  if (nativeShareButton) {
    if (!navigator.share) {
      nativeShareButton.hidden = true;
    } else {
      nativeShareButton.addEventListener("click", async () => {
        try {
          await navigator.share({
            title: document.title,
            text: "ManthanBites par yeh health article padhein:",
            url: window.location.href.split("#")[0]
          });
        } catch (error) {
          /* User cancellation is normal; no error message needed. */
        }
      });
    }
  }

})();
