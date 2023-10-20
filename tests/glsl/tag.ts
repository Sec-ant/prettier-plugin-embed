/* glsl */ `
void f() {
  switch (a) {
      case 1:
          a = 2;
          break;
      case 2: // comment
      default:
          a = 3;
  }

  // empty switch
  switch (a) {}
    // empty switch w/ comment
    switch (a) {
      // Hello there!
    }

  // init over multiple lines
  switch(foo(aaaaaaaaaa, bbbbbbbbb, cccccc)) {
  }
  switch (aaaaaaaa+bbbbbbbbbbbb-cccccc){}

  // case over multiple lines
  switch (a) {
      case aaaaaaaa + bbbbbbbb +cccccccccc:
      a = 3;
  }

  // correct empty lines are kept
  switch (a) {

      case 1:

          b = 2;

      case 2:
          b = 3;

      default:

  }

switch // weird comment
(a) {}
switch (a) // weird comment 2
{}
}`;
