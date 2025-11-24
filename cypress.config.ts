import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
        reporter: 'junit',
    reporterOptions: {
      mochaFile: 'cypress/results/results-[hash].xml', 
      jenkinsMode: true,
      outputs: true,
      testsuitesTitle: 'Cypress Tests' 
    },
    specPattern: "**/*.cy.ts",
  },
});