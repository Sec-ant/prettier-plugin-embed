import { any } from "code-tag";
const xml = any;

xml`
<svg
  xmlns   =    "http://www.w3.org/2000/svg"
    xmlns:xlink =  "http://www.w3.org/1999/xlink"
  width = "200"
        height="100"
  viewBox="0 0 200 100"
>${"123"}</svg>
`;
