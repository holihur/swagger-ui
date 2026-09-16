describe("configuration options: `languages` and `languages.primaryName`", () => {
  it("should render a language switcher", () => {
    cy.visit("/?configUrl=/configs/languages.yaml")
    cy.get('[data-testid="language-select"]').click()
    cy.get('[role="option"]')
      .should("have.length", 2)
      .eq(0)
      .should("have.text", "English")
    cy.get('[role="option"]').eq(1).should("have.text", "中文")
    cy.get('[data-testid="language-select"]').type("{esc}")
  })

  it("should render the first language by default", () => {
    cy.visit("/?configUrl=/configs/languages.yaml")
      .get("h1.title")
      .should("have.text", "OneOAS 2.0")
      .window()
      .then((win) => win.ui.specSelectors.url())
      .should("match", /\/documents\/features\/urls\/1\.yaml$/)
  })

  it("should respect a `languages.primaryName`", () => {
    cy.visit("/?configUrl=/configs/languages-primary-name.yaml")
      .get('[data-testid="language-select"]')
      .should("contain.text", "中文")
      .get("h1.title")
      .should("have.text", "TwoOAS 3.0")
  })

  it("should switch the displayed language on selection", () => {
    cy.visit("/?configUrl=/configs/languages.yaml")
    cy.get('[data-testid="language-select"]').click()
    cy.get('[role="option"]').eq(1).click()
    cy.get("h1.title").should("have.text", "TwoOAS 3.0")
  })
})
