describe("HRMS Application", () => {
  it("should open the application", () => {
    cy.visit("http://localhost:8080/dashboard");

    cy.title().should("include", "HRMS");
  });
});
