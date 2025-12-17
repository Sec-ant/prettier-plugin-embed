// YAML - Tag `yaml` test (with formatting issues)
const tagTest = yaml`
name:   myapp
version:   1.0.0
author:   John
`;

// YAML - Comment `/* yaml */` test (with formatting issues)
const commentTest = /* yaml */ `
server:
  host:   localhost
  port:   3000
`;
