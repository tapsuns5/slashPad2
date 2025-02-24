import toast from "react-hot-toast";

let isInitialized = false;

export function initializeClipboardCopy() {
  // Prevent multiple initializations
  if (isInitialized) return;
  
  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    if (target.tagName === "CODE") {
      const codeRect = target.getBoundingClientRect();
      const clickX = e.clientX - codeRect.left;
      const clickY = e.clientY - codeRect.top;

      // Check if click is in the top-right corner (copy button area)
      if (clickX >= codeRect.width - 60 && clickY <= 40) {
        // Prevent multiple copies if already copied
        if (target.classList.contains("copied")) return;

        try {
          const codeContent = target.textContent || "";
          await navigator.clipboard.writeText(codeContent);

          // Add copied state
          target.classList.add("copied");

          // Show toast notification
          toast.success("Copied to clipboard", {
            position: "bottom-center",
            duration: 2000,
          });

          // Reset copied state after 2s
          setTimeout(() => {
            target.classList.remove("copied");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy:", err);
          toast.error("Failed to copy text.");
        }
      }
    }
  });

  isInitialized = true;
}
