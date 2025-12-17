// PEG.js - Tag `pegjs` test (with formatting issues)
const tagTest = pegjs`
start=a:word+ {return a.join("")}
word="hello"/"world"
`;

// PEG.js - Comment `/* pegjs */` test (with formatting issues)
/* pegjs */ `
digit="0"/"1"/"2"/"3"/"4"/"5"/"6"/"7"/"8"/"9"
`;
