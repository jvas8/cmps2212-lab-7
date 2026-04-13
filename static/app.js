import { emitter }     from './modules/event-emitter.js'
import { state }       from './state.js'
import { DataService } from './modules/data-service.js'
import { render }      from './render.js'

emitter.on('registration:submit', (payload) => {
  const optimistic = { ...payload, optimistic: true }
  state.registrations.unshift(optimistic)
  render()
  DataService.createRegistration(payload)
})

render()