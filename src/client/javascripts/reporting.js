import { DatePicker } from '@ministryofjustice/frontend'
import { createAll, Tabs } from 'govuk-frontend'
import Chart from 'chart.js/auto'

createAll(Tabs)

const preventScroll = () => {
  const url = new URL(window.location.href)
  const tab = url.searchParams.get('tab')

  if (tab === 'charts-view') {
    const panel = document.getElementById('charts-view')
    panel.id = ''
    document.getElementById('tab_charts-view').click()
    panel.id = 'charts-view'
    panel.setAttribute('class', 'govuk-tabs__panel')
  }
}

const hideTables = () => {
  const tables = document.querySelectorAll('table')
  tables.forEach((table) => {
    const parent = table.parentElement
    parent.hidden = true
  })
}

const initDatePickers = () => {
  const datePickers = document.querySelectorAll(
    '[data-module="moj-date-picker"]'
  )

  datePickers.forEach((input) => new DatePicker(input))
}

const getJSON = (id) => JSON.parse(document.getElementById(id).textContent)

const initCharts = () => {
  const labels = getJSON('chart-labels')
  const charts = ['matches', 'releases', 'clearanceRequests', 'notifications']
  const dataOptions = { cubicInterpolationMode: 'monotone' }

  charts.forEach((chart) => {
    const datasets = getJSON(`${chart}-data`)
    const element = document.getElementById(chart)

    new Chart(element, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((dataset) => ({ ...dataset, ...dataOptions }))
      },
      options: {
        elements: {
          point: {
            hitRadius: 6,
            hoverRadius: 5
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            displayColors: false,
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderWidth: 1,
            titleColor: '#0b0c0c',
            bodyColor: '#0b0c0c',
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 14
            },
            padding: 12,
            boxPadding: 6
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Volume'
            },
            ticks: {
              precision: 0
            }
          }
        }
      }
    })
  })
}

const setLinkHrefs = (href) => {
  const links = document.querySelectorAll('#shortcuts a')
  const tabInput = document.getElementById('tab')

  const { hash } = new URL(href)
  if (hash) {
    tabInput.value = hash.replace('#', '')

    links.forEach((link) => {
      const linkUrl = new URL(link.href)
      linkUrl.searchParams.set('tab', hash.replace('#', ''))
      link.href = linkUrl.toString()
    })
  }
}

const initTabsHook = () => {
  setLinkHrefs(window.location.href)

  const tabs = [
    document.getElementById('tab_summary-view'),
    document.getElementById('tab_charts-view')
  ]
  tabs.forEach((tab) =>
    tab.addEventListener('click', (event) => setLinkHrefs(event.target.href))
  )
}

const initReporting = () => {
  preventScroll()
  hideTables()
  initDatePickers()
  initCharts()
  initTabsHook()
}

window.BTMS = window.BTMS || {}
window.BTMS.initReporting = initReporting
