// XML - Tag `xml` test (with formatting issues)
const tagTest = xml`
<root attribute="value"><item>Content</item><element id="123">Text</element></root>
`;

// XML - Comment `/* xml */` test (with formatting issues)
/* xml */ `
<doc><node attr="1" attr2="2"><child/></node></doc>
`;
