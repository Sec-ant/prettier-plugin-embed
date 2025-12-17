// TOML - Tag `toml` test (with formatting issues)
const tagTest = toml`
[package]
name="myapp"
version="1.0.0"
`;

// TOML - Comment `/* toml */` test (with formatting issues)
/* toml */ `
[dependencies]
lodash="^4.0"
express="~4.18"
`;
