const tagged = liquid`
<section>{% if user %}<h1>{{user.name | escape}}</h1>{% else %}<p>Guest</p>{% endif %}</section>
`;

const commented = /* liquid */ `
<section>{% if user %}<h1>{{user.name | escape}}</h1>{% else %}<p>Guest</p>{% endif %}</section>
`;
