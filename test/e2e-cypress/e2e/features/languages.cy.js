describe("configuration options: `languages` and `languages.primaryName`", () => {
  it("should render a language switcher", () => {
    cy.visit("/?configUrl=/configs/languages.yaml")
      .get("#select-language")
      .children()
      .should("have.length", 2)
      .get("#select-language > option")
      .eq(0)
      .should("have.text", "English")
      .get("#select-language > option")
      .eq(1)
      .should("have.text", "中文")
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
      .get("#select-language")
      .should("contain.value", "/documents/features/urls/2.yaml")
      .get("h1.title")
      .should("have.text", "TwoOAS 3.0")
  })

  it("should switch the displayed language on selection", () => {
    cy.visit("/?configUrl=/configs/languages.yaml")
      .get("#select-language")
      .select("/documents/features/urls/2.yaml")
      .get("h1.title")
      .should("have.text", "TwoOAS 3.0")
  })
})
