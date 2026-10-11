const tagged = motoko`
actor {public query func greet(name:Text): async Text {"Hello, " # name;};}
`;

const commented = /* motoko */ `
actor {public query func greet(name:Text): async Text {"Hello, " # name;};}
`;
