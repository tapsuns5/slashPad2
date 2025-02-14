export function initializeClipboardCopy() {
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'CODE') {
      const codeRect = target.getBoundingClientRect();
      const clickX = e.clientX - codeRect.left;
      const clickY = e.clientY - codeRect.top;
      
      // Check if click is in the top-right corner (copy button area)
      if (clickX >= codeRect.width - 60 && clickY <= 40) {
        // Don't do anything if already in copied state
        if (target.classList.contains('copied')) return;
        
        try {
          const codeContent = target.textContent || '';
          await navigator.clipboard.writeText(codeContent);
          
          target.classList.add('copied');
          
          setTimeout(() => {
            target.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      }
    }
  });
} 