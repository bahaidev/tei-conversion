// For use with https://brettz9.github.io/jtlt/demo/ and books/hidden-words.xml

[

['/', function () {
  this.applyTemplates('//p[@n]');
}],

['//p[@n]', function () {
  this.element('p', function () {
    this.applyTemplates();
    this.valueOf({select: './text()[2]'});
  });
  this.string('\n\n')
}],


['hi', function () {
  this.element('div', function () {
    this.element('i', function () {
      this.valueOf({select: '.'})
    });
  });
  this.string('\n\n')
}]

]
