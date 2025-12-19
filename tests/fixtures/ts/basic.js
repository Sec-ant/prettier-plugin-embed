// TypeScript - Tag `ts` test (with formatting issues)
const tagTest = ts`
interface User{id:number;name:string}const getUser=(id:number):User=>({id,name:"test"})
`;

// TypeScript - Comment `/* ts */` test (with formatting issues)
/* ts */ `
type Props={title:string;count?:number};const fn=():Props=>({title:"hi"})
`;
