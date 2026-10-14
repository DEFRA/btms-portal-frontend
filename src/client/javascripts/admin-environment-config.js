/**
 * @param {string} textElementId - Id of the element whose text will be copied
 * @param {string} copyElementId - Id of the copy button element
 * @param {string} screenReaderAlertText - text that will be added into live region for screen reader users
 * @param {string} originalCopyText - original text of copy button element
 **/
export const initCopy = (textElementId, copyElementId, screenReaderAlertText, originalCopyText = 'Copy') => {
  const textElement = document.querySelector(textElementId);
  const copyElement = document.querySelector(copyElementId);
  const screenReaderAlert = document.getElementById("copy-alert");

  if (textElement && copyElement) {
    copyElement.addEventListener('click', (e) => {
      e.preventDefault();

      const text = textElement.textContent.trim();
      navigator.clipboard.writeText(text);
      screenReaderAlert.textContent = screenReaderAlertText;
      copyElement.classList.add('btms-copy-disable-click');
      copyElement.textContent = "Copied";

      setTimeout(() => {
        screenReaderAlert.textContent = "";
        copyElement.classList.remove('btms-copy-disable-click');
        copyElement.textContent = originalCopyText;
      }, 3000);

      copyElement.blur();
      return true;
    });
  }
}

window.BTMS = window.BTMS || {}
window.BTMS.initCopy = initCopy
