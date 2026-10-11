const generated: string = xquery`
declare variable $value := ${getFirstValue({ items: [1, 2], enabled: true })}; <item label="${getSecondValue(/* label */ { value: input })}">{$value}</item>
`;
