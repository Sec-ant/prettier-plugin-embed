const generated: string = jinja`
<section class="${getFirstValue({ items: [1, 2], enabled: true })}">
{% if user %}
<h1>${getSecondValue(/* label */ { value: input })} {{user.name}}</h1>
{% endif %}
</section>
`;
