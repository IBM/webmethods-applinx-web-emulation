//import { Component, ViewChild } from "@angular/core"
import { mount } from 'cypress/angular'
import { BlankComponent } from "./blank.component"

describe('MacroComponent', () => {
    it('can mount using WrapperComponent', () => {
        mount(BlankComponent);
        //cy.get().should('exist');
    });      
});