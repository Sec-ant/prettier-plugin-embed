const generated: string = svelte`
<script>let name=${getFirstValue({ items: [1, 2], enabled: true })};</script><section class="${getSecondValue(/* label */ { value: input })}"><h1>Hello {name}</h1></section>
`;
