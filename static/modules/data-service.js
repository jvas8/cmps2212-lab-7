import { emitter } from './event-emitter.js'

const BASE = '/api'

export const DataService = {
  async createRegistration(payload) {
    try {
      const res = await fetch(`${BASE}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`)
      }
      const registration = await res.json()
      emitter.emit('registration:saved', registration)
    } catch (err) {
      emitter.emit('registration:error', err.message)
    }
  },
}