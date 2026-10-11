const generated: string = gherkin`
Feature: ${getFirstValue({ items: [1, 2], enabled: true })}
Scenario: Success
Given a user named "${getSecondValue(/* label */ { value: input })}"
Then the user signs in
`;
