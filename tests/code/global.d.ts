declare const TAG: (
  quasis: TemplateStringsArray,
  ...values: string[]
) => unknown;
// declare tag names for testing only
// add new tag names to the list below
// so we can use them in the test files
declare const [
  html,
  xml,
  xsd,
  ascx,
  atom,
  axml,
  axaml,
  bpmn,
  cpt,
  csl,
  csproj,
  dita,
  ditamap,
  dtd,
  ent,
  mod,
  dtml,
  fsproj,
  fxml,
  iml,
  isml,
  jmx,
  launch,
  menu,
  mxml,
  nuspec,
  opml,
  owl,
  proj,
  props,
  pt,
  publishsettings,
  pubxml,
  rbxlx,
  rbxmx,
  rdf,
  rng,
  rss,
  shproj,
  storyboard,
  svg,
  targets,
  tld,
  tmx,
  vbproj,
  vcxproj,
  wsdl,
  wxi,
  wxl,
  wxs,
  xaml,
  xbl,
  xib,
  xlf,
  xliff,
  xpdl,
  xul,
  xoml,
]: (typeof TAG)[];