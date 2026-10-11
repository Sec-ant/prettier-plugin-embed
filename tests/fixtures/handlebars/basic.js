const tagged = handlebars`
<section>{{#if user}}<h1>{{user.name}}</h1>{{else}}<p>Guest</p>{{/if}}</section>
`;

const commented = /* handlebars */ `
<section>{{#if user}}<h1>{{user.name}}</h1>{{else}}<p>Guest</p>{{/if}}</section>
`;
