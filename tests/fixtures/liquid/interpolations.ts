const generated: string = liquid`
<section class="${getFirstValue({ items: [1, 2], enabled: true })}">{% if user %}<h1>${getSecondValue(/* label */ { value: input })} {{user.name | escape}}</h1>{% endif %}</section>
`;
