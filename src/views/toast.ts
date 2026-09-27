import type { Toast } from '../types'
import { escHtml } from '../utils/dom'

export function renderToast(toast: Toast): string {
  return `<div class="toast ${toast.type}">${escHtml(toast.message)}</div>`
}
