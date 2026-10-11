const tagged = nunjucks`
<section>{% if user %}<h1>{{user.name}}</h1>{% else %}<p>Guest</p>{% endif %}</section>
`;

const commented = /* nunjucks */ `
<section>{% if user %}<h1>{{user.name}}</h1>{% else %}<p>Guest</p>{% endif %}</section>
`;
