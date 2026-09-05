const sass = require('sass');
const result = sass.compileString(`
.ckeditor5-component,
.ur-editor-wrapper {
  width: 100%;
  
  .ck-content .table table td,
  .ck-content .table table th {
    overflow: visible !important;
    scrollbar-width: none !important;
  }
}
`);
console.log('=== COMPILED SCSS OUTPUT ===');
console.log(result.css);
