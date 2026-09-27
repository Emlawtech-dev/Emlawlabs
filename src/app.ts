import './styles/main.css'
import { createInitialState } from './types'
import type { Toast } from './types'
import { renderNav } from './views/nav'
import { renderConnect } from './views/connect'
import { renderDashboard } from './views/dashboard'
import { renderSend } from './views/send'
import { renderReceive } from './views/receive'
import { renderTrustline } from './views/trustline'
import { renderToast } from './views/toast'
import { bindEvents } from './handlers/actions'

export const state = createInitialState()

let toastTimer: number | null = null

export function render(): void {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = `
    <canvas id="starfield"></canvas>
    <div class="app-shell">
      ${renderNav(state)}
      ${renderCurrentView()}
      ${state.toast ? renderToast(state.toast) : ''}
    </div>
  `
  initStarfield()
  bindEvents()
}

function renderCurrentView(): string {
  if (state.view === 'connect') return renderConnect(state)
  if (state.loading) return `<div class="loading-wrap"><div class="spinner"></div></div>`
  if (state.view === 'send') return renderSend(state)
  if (state.view === 'receive') return renderReceive(state)
  if (state.view === 'trustline') return renderTrustline(state)
  return renderDashboard(state)
}

export function showToast(message: string, type: Toast['type']): void {
  if (toastTimer) clearTimeout(toastTimer)
  state.toast = { message, type }

  const existing = document.querySelector('.toast')
  if (existing) {
    existing.className = `toast ${type}`
    existing.textContent = message
  } else {
    render()
  }

  toastTimer = window.setTimeout(() => {
    state.toast = null
    document.querySelector('.toast')?.remove()
  }, 4000)
}

function initStarfield(): void {
  const canvas = document.getElementById('starfield') as HTMLCanvasElement | null
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2,
    o: Math.random() * 0.6 + 0.2,
  }))

  function draw() {
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of stars) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200, 210, 255, ${s.o})`
      ctx.fill()
      s.o += (Math.random() - 0.5) * 0.02
      s.o = Math.max(0.1, Math.min(0.8, s.o))
    }
    requestAnimationFrame(draw)
  }

  draw()
}

export function start(): void {
  render()
}
