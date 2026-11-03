const COPY_TEXT_RESET_WAIT_TIME = 3000
const DISABLED_BUTTON_CLASS = 'btms-copy-disable-click'

const setCopyFeedback = (copyElement, screenReaderAlert, screenReaderAlertText, originalCopyText, feedbackText) => {
  screenReaderAlert.textContent = screenReaderAlertText;
  copyElement.classList.add(DISABLED_BUTTON_CLASS);
  copyElement.textContent = feedbackText;

  setTimeout(() => {
    screenReaderAlert.textContent = "";
    copyElement.classList.remove(DISABLED_BUTTON_CLASS);
    copyElement.textContent = originalCopyText;
  }, COPY_TEXT_RESET_WAIT_TIME);
}

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
      navigator.clipboard.writeText(text).then(() => {
        setCopyFeedback(copyElement, screenReaderAlert, screenReaderAlertText, originalCopyText, 'Copied')
      }).catch(_ => {
        setCopyFeedback(copyElement, screenReaderAlert, 'Failed to copy to clipboard', originalCopyText, 'Copy failed')
      });

      copyElement.blur();
      return true;
    });
  }
}

window.BTMS = window.BTMS || {}
window.BTMS.initCopy = initCopy
