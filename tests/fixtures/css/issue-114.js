// Issue #114: CSS comments cause unstable formatting
// https://github.com/Sec-ant/prettier-plugin-embed/issues/114
const a = css`
  /*
    Minimum column size of 0 required to prevent long
    words from increasing the column size
    https://css-tricks.com/preventing-a-grid-blowout/
  */
  grid-template-columns: 115px minmax(0, 1fr);
`;
