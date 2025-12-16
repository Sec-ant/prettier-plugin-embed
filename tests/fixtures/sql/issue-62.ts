// Issue #62: Literal tags with type annotations
// https://github.com/Sec-ant/prettier-plugin-embed/issues/62
type Revenue = any;
declare function sql<_>(strings: TemplateStringsArray, ...values: any[]): any;
declare const id: any;
sql<Revenue>`
  SELECT * FROM revenue WHERE id = ${id}
`;
