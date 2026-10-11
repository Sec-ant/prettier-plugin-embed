const tagged = powershell`
if($true){Write-Output "hello"}else{Write-Output "world"}
`;

const commented = /* powershell */ `
if($true){Write-Output "hello"}else{Write-Output "world"}
`;
