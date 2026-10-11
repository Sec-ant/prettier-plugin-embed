const generated: string = powershell`
Write-Output "${getFirstValue({ items: [1, 2], enabled: true })}"
Write-Output "${getSecondValue(/* label */ { value: input })}"
`;
