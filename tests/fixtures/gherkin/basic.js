const tagged = gherkin`
Feature: Login
Scenario: Success
Given a user
When the user signs in
Then the user sees a dashboard
`;

const commented = /* gherkin */ `
Feature: Login
Scenario: Success
Given a user
When the user signs in
Then the user sees a dashboard
`;
