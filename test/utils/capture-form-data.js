export const captureFormData = () => {
  let formdata = null

  document.addEventListener('submit', function (event) {
    event.preventDefault()

    const data = {}

    for (const el of event.target.elements) {
      if (el.name && !el.disabled) {
        if (el.type === 'radio' && !el.checked) continue
        data[el.name] = el.value
      }
    }

    formdata = data
  })

  return { formdata: () => formdata }
}
