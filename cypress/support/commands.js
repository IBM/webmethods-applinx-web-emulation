import { mount } from 'cypress/angular'

Cypress.Commands.add('mount', (component, config) => {
  return mount(component, config)
})