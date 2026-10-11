const tagged = jinja`
<section>{% if user %}<h1>{{user.name}}</h1>{% else %}<p>Guest</p>{% endif %}</section>
`;

const commented = /* jinja */ `
<section>{% if user %}<h1>{{user.name}}</h1>{% else %}<p>Guest</p>{% endif %}</section>
`;
