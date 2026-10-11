const generated: string = motoko`
actor {let name:Text="${getFirstValue({ items: [1, 2], enabled: true })}";let total:Nat=${getSecondValue(/* label */ { value: input })};}
`;
