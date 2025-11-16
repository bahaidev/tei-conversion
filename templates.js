// For use with https://brettz9.github.io/jtlt/demo/ and books/hidden-words.xml

[

['//p[@n]', function (p) {
  this.element('p', function () {
    this.applyTemplates();
    this.text(p.childNodes[2].nodeValue);
  });
  this.string('\n\n')
}],


['hi', function (p) {
  this.element('div', function () {
    this.element('i', function () {
      this.text(p.textContent)
    });
  });
  this.string('\n\n')
}]

]

