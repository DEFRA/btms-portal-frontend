import Chart from 'chart.js/auto'

function setView({ target }) {
  const graph = document.getElementById('graph')
  const table = document.getElementById('table')

  if (target.checked) {
    graph.hidden = true
    table.hidden = false
  } else {
    graph.hidden = false
    table.hidden = true
  }
}
function initToggle() {
  const toggle = document.getElementById('toggle')

  toggle.addEventListener('change', setView)
}

function initCharts() {
  const data = JSON.parse(document.getElementById('data')?.innerText)

  const matches = document.getElementById('matches')
  /* eslint-disable no-new */
  new Chart(matches, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [data.matches, data.noMatches]
    },
    options: {
      elements: {
        line: {
          tension: 0.3
        }
      }
    }
  })

  const releases = document.getElementById('releases')
  /* eslint-disable no-new */
  new Chart(releases, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [data.autoReleases, data.manualReleases]
    },
    options: {
      elements: {
        line: {
          tension: 0.3
        }
      }
    }
  })

  initToggle()
}

window.BTMS = window.BTMS || {}
window.BTMS = {
  ...window.BTMS,
  initCharts
}
