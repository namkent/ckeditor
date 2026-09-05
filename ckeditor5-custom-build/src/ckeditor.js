import {
  ClassicEditor as ClassicEditorBase,
  InlineEditor as InlineEditorBase,
  BalloonEditor as BalloonEditorBase,
  DecoupledEditor as DecoupledEditorBase,
  Autoformat,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  RemoveFormat,
  BlockQuote,
  Heading,
  Link,
  AutoLink,
  LinkImage,
  List,
  ListProperties,
  TodoList,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Base64UploadAdapter,
  MediaEmbed,
  HtmlEmbed,
  CodeBlock,
  HorizontalLine,
  Alignment,
  FontFamily,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Highlight,
  SourceEditing,
  GeneralHtmlSupport,
  WordCount,
  FindAndReplace,
  SpecialCharacters,
  SpecialCharactersEssentials,
  PageBreak,
  ShowBlocks,
  SelectAll,
  Markdown,
  Essentials,
  Paragraph,
  Fullscreen,
  Emoji
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import '@ckeditor/ckeditor5-fullscreen/dist/index.css';
import '@ckeditor/ckeditor5-emoji/dist/index.css';
import './custom.css';

// Common Plugin List
const builtinPlugins = [
  Essentials,
  Paragraph,
  Autoformat,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  RemoveFormat,
  BlockQuote,
  Heading,
  Link,
  AutoLink,
  LinkImage,
  List,
  ListProperties,
  TodoList,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Base64UploadAdapter,
  MediaEmbed,
  HtmlEmbed,
  CodeBlock,
  HorizontalLine,
  Alignment,
  FontFamily,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Highlight,
  FindAndReplace,
  SpecialCharacters,
  SpecialCharactersEssentials,
  PageBreak,
  ShowBlocks,
  SelectAll,
  Fullscreen,
  Emoji,
  SourceEditing,
  GeneralHtmlSupport,
  WordCount
];

// Common Default Config
const defaultConfig = {
  licenseKey: 'GPL',
  ui: {
    poweredBy: {
      position: 'inside',
      side: 'right',
      label: ''
    }
  },
  toolbar: {
    items: [
      'heading',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      'highlight',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'code',
      'subscript',
      'superscript',
      'removeFormat',
      '|',
      'alignment',
      'bulletedList',
      'numberedList',
      'todoList',
      '|',
      'link',
      'insertImage',
      'insertTable',
      'blockQuote',
      'codeBlock',
      'horizontalLine',
      'specialCharacters',
      'emoji',
      'pageBreak',
      'mediaEmbed',
      'htmlEmbed',
      '|',
      'findAndReplace',
      'showBlocks',
      'selectAll',
      'fullscreen',
      'sourceEditing',
      'undo',
      'redo'
    ],
    shouldNotGroupWhenFull: true
  },
  image: {
    toolbar: [
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:side',
      '|',
      'toggleImageCaption',
      'imageTextAlternative',
      '|',
      'linkImage'
    ]
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'tableProperties',
      'tableCellProperties',
      'toggleTableCaption'
    ]
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' }
    ]
  },
  htmlSupport: {
    allow: [
      {
        name: /.*/,
        attributes: true,
        classes: true,
        styles: true
      }
    ]
  },
  language: 'en'
};

// Helper to wrap create method
function wrapEditorClass(BaseClass) {
  class CustomEditor extends BaseClass {}
  CustomEditor.builtinPlugins = [...builtinPlugins];
  CustomEditor.defaultConfig = JSON.parse(JSON.stringify(defaultConfig));
  return CustomEditor;
}

// Instantiate 4 Editor types
const ClassicEditor = wrapEditorClass(ClassicEditorBase);
const InlineEditor = wrapEditorClass(InlineEditorBase);
const BalloonEditor = wrapEditorClass(BalloonEditorBase);
const DecoupledEditor = wrapEditorClass(DecoupledEditorBase);

// Attach extra plugins and editors to ClassicEditor for convenience
ClassicEditor.ClassicEditor = ClassicEditor;
ClassicEditor.InlineEditor = InlineEditor;
ClassicEditor.BalloonEditor = BalloonEditor;
ClassicEditor.DecoupledEditor = DecoupledEditor;
ClassicEditor.Markdown = Markdown;
ClassicEditor.Fullscreen = Fullscreen;
ClassicEditor.Emoji = Emoji;

export {
  ClassicEditor,
  InlineEditor,
  BalloonEditor,
  DecoupledEditor,
  Markdown,
  Fullscreen,
  Emoji
};

export default ClassicEditor;
