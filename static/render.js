import { state } from './state.js'
import { emitter } from './modules/event-emitter.js'

function validate(fields) {
  const errors = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!fields.eventDate) {
    errors.eventDate = 'Event date is required'
  } else {
    const chosen = new Date(fields.eventDate + 'T00:00:00')
    if (chosen <= today) {
      errors.eventDate = 'Date must be in the future'
    }
  }

  const tickets = parseInt(fields.tickets, 10)
  if (!fields.tickets) {
    errors.tickets = 'Number of tickets is required'
  } else if (isNaN(tickets) || tickets < 1 || tickets > 5) {
    errors.tickets = 'Tickets must be between 1 and 5'
  }

  if (!fields.terms) {
    errors.terms = 'You must agree to the Terms & Conditions'
  }

  return errors
}

function handleSubmit(e) {
  e.preventDefault()

  const form = e.target
  const fields = {
    eventDate: form.querySelector('[name="eventDate"]').value,
    tickets: form.querySelector('[name="tickets"]').value,
    terms: form.querySelector('[name="terms"]').checked,
  }

  const errors = validate(fields)

  if (Object.keys(errors).length > 0) {
    emitter.emit('form:errors', errors)
    return
  }

  emitter.emit('registration:submit', {
    eventDate: fields.eventDate,
    tickets: parseInt(fields.tickets, 10),
  })
}


function renderRegistrations() {
  if (state.registrations.length === 0) return ''

  const cards = state.registrations.map(r => `
    <div class="registration-card ${r.optimistic ? 'optimistic' : ''}">
      <div class="reg-info">
        <div class="reg-date">📅 ${r.eventDate}</div>
        <div class="reg-tickets">🎟️ ${r.tickets} ticket${r.tickets > 1 ? 's' : ''}</div>
        ${r.optimistic
          ? '<span class="badge-saving">saving...</span>'
          : '<span class="badge-confirmed">✓ confirmed</span>'}
      </div>
    </div>
  `).join('')

  return `
    <div>
      <div class="section-title">🌟 Your Registrations</div>
      <div class="registration-list">${cards}</div>
    </div>
  `
}

function renderForm(errors = {}) {
  return `
    <div class="form-card">
      <h2>🐾 Register for an Event</h2>

      ${state.successMessage
        ? `<div class="success-banner">✨ ${state.successMessage}</div>`
        : ''}

      <form id="event-form" class="ui-form">

        <div class="field-group">
          <label class="field-label" for="eventDate">Event Date</label>
          <input
            class="ui-input ${errors.eventDate ? 'error' : ''}"
            id="eventDate"
            name="eventDate"
            type="date"
          />
          ${errors.eventDate ? `<span class="field-error">${errors.eventDate}</span>` : ''}
        </div>

        <div class="field-group">
          <label class="field-label" for="tickets">Number of Tickets</label>
          <input
            class="ui-input ${errors.tickets ? 'error' : ''}"
            id="tickets"
            name="tickets"
            type="number"
            min="1"
            max="5"
            placeholder="1 – 5"
          />
          ${errors.tickets ? `<span class="field-error">${errors.tickets}</span>` : ''}
        </div>

        <div class="field-group">
          <label class="checkbox-row">
            <input
              class="ui-checkbox ${errors.terms ? 'error' : ''}"
              name="terms"
              type="checkbox"
            />
            <span class="checkbox-label">I agree to the Terms & Conditions</span>
          </label>
          ${errors.terms ? `<span class="field-error">${errors.terms}</span>` : ''}
        </div>

        <button class="ui-btn" type="submit">Submit ✨</button>
      </form>
    </div>

    ${renderRegistrations()}
  `
}

let currentErrors = {}

export function render() {
  const app = document.querySelector('#app')
  if (app) {
    app.innerHTML = renderForm(currentErrors)
  }

  const form = document.querySelector('#event-form')
  if (form) {
    form.addEventListener('submit', handleSubmit)
  }
}

emitter.on('form:errors', (errors) => {
  currentErrors = errors
  render()
})

emitter.on('registration:submit', () => {
  currentErrors = {}
  state.successMessage = null
  render()
})

emitter.on('registration:saved', (reg) => {
  const idx = state.registrations.findIndex(r => r.optimistic && r.eventDate === reg.eventDate)
  if (idx !== -1) {
    state.registrations[idx] = reg
  }
  state.successMessage = `You're registered for ${reg.eventDate}! See you there! 🎉`
  render()
})

emitter.on('registration:error', () => {
  render()
})