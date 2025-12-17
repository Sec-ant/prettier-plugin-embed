// PHP - Tag `php` test (with formatting issues)
const tagTest = php`
<?php function greet($name){echo "Hello ".$name;}class User{public $name;} ?>
`;

// PHP - Comment `/* php */` test (with formatting issues)
/* php */ `
<?php $x=1;$y=2;echo $x+$y; ?>
`;
