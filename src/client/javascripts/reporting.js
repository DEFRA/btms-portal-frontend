import { DatePicker } from '@ministryofjustice/frontend'

const initReporting = () => {
  const datePickers = document.querySelectorAll(
    '[data-module="moj-date-picker"]'
  )

  datePickers.forEach((input) => new DatePicker(input))
}

window.BTMS.initReporting = initReporting
