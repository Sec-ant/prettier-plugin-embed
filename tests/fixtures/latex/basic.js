// LaTeX - Tag `latex` test (with formatting issues: missing newlines)
const tagTest = latex`
\\documentclass{article}\\begin{document}\\section{Title}Hello world.\\end{document}
`;

// LaTeX - Comment `/* latex */` test (with formatting issues)
/* latex */ `
\\begin{equation}E=mc^2\\end{equation}
`;
