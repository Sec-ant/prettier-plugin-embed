const generated: string = solidity`
pragma solidity ^0.8.20;contract Counter{string public name="${getFirstValue({ items: [1, 2], enabled: true })}";uint public count=${getSecondValue(/* label */ { value: input })};}
`;
