import {
  ClassicEditor as ClassicEditorBase,
  InlineEditor as InlineEditorBase,
  BalloonEditor as BalloonEditorBase,
  DecoupledEditor as DecoupledEditorBase,
  Plugin,
  ButtonView,
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
  Paragraph
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import './custom.css';

// SVG Icons for Fullscreen toggle
const MAXIMIZE_ICON = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 5.75a.75.75 0 0 1 0-1.5H15a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.81l-2.72 2.72a.75.75 0 0 1-1.06-1.06l2.72-2.72zm-1.97 4.72a.75.75 0 0 1 0 1.06l-2.72 2.72H8.5a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 1 1.5 0v1.69l2.72-2.72a.75.75 0 0 1 1.06 0"></path><path d="M2 0h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m16 1.5H2a.5.5 0 0 0-.5.5v16a.5.5 0 0 0 .5.5h16a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5"></path></svg>';
const MINIMIZE_ICON = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.53 5.53a.75.75 0 0 0-1.06-1.06l-2.72 2.72V5.5a.75.75 0 0 0-1.5 0V9a.75.75 0 0 0 .75.75h3.5a.75.75 0 0 0 0-1.5h-1.69zM5.5 10.25a.75.75 0 0 0 0 1.5h1.69l-2.72 2.72a.75.75 0 1 0 1.06 1.06l2.72-2.72v1.69a.75.75 0 0 0 1.5 0V11a.75.75 0 0 0-.75-.75z"></path><path d="M0 2a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm18.5 0a.5.5 0 0 0-.5-.5H2a.5.5 0 0 0-.5.5v16a.5.5 0 0 0 .5.5h16a.5.5 0 0 0 .5-.5z"></path></svg>';

// Custom Fullscreen Plugin (Single-instance safe)
class Fullscreen extends Plugin {
  static get pluginName() {
    return 'Fullscreen';
  }

  init() {
    const editor = this.editor;

    // Prevent duplicate button registration on the same editor instance
    if (editor.ui.componentFactory.has('fullscreen')) {
      return;
    }

    editor.ui.componentFactory.add('fullscreen', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: 'Toàn màn hình (Full Screen)',
        icon: MAXIMIZE_ICON,
        tooltip: true,
        isToggleable: true
      });

      view.on('execute', () => {
        let wrapper = null;
        if (editor.ui && editor.ui.view && editor.ui.view.element) {
          wrapper = editor.ui.view.element.closest('.ckeditor5-component');
        }
        if (!wrapper) {
          wrapper = document.querySelector('.ckeditor5-component');
        }
        if (wrapper) {
          const isFullscreen = wrapper.classList.toggle('ck-fullscreen-active');
          view.isOn = isFullscreen;
          view.icon = isFullscreen ? MINIMIZE_ICON : MAXIMIZE_ICON;
          view.label = isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình (Full Screen)';
          document.body.style.overflow = isFullscreen ? 'hidden' : '';
        }
      });

      return view;
    });
  }
}

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

export {
  ClassicEditor,
  InlineEditor,
  BalloonEditor,
  DecoupledEditor,
  Markdown,
  Fullscreen
};

export default ClassicEditor;
