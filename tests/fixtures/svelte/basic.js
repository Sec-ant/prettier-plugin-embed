const tagged = svelte`
<script>let name='World';</script><section><h1>Hello {name}</h1></section>
`;

const commented = /* svelte */ `
<script>let name='World';</script><section><h1>Hello {name}</h1></section>
`;
