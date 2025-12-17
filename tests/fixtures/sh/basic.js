// Shell - Tag `sh` test (with formatting issues: missing spaces, semicolons)
const tagTest = sh`
#!/bin/bash
if [ "$1" = "test" ];then echo "Test mode";else echo "Normal";fi
`;

// Shell - Comment `/* sh */` test (with formatting issues)
/* sh */ `
for i in 1 2 3;do echo $i;done
`;
