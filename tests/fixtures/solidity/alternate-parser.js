// @prettier {"embeddedSolidityParser":"antlr"}
const generated = solidity`
pragma solidity ^0.8.20;contract Counter{uint public count=0;function increment() public{count+=1;}}
`;
