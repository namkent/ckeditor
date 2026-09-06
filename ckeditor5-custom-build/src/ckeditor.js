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
  ImageInsert,
  ImageInsertViaUrl,
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
  GeneralHtmlSupport,
  WordCount,
  FindAndReplace,
  SpecialCharacters,
  SpecialCharactersEssentials,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersMathematical,
  SpecialCharactersLatin,
  SpecialCharactersText,
  PageBreak,
  ShowBlocks,
  SelectAll,
  Markdown,
  Essentials,
  Paragraph,
  Fullscreen,
  Emoji,
  Indent,
  IndentBlock,
  PasteFromOffice,
  TextTransformation,
  AutoImage,
  PictureEditing,
  TableScroll,
  TableLayout,
  Bookmark,
  Plugin,
  ButtonView
} from 'ckeditor5';
import { IconSource } from '@ckeditor/ckeditor5-icons';

import 'ckeditor5/ckeditor5.css';
import '@ckeditor/ckeditor5-fullscreen/dist/index.css';
import '@ckeditor/ckeditor5-emoji/dist/index.css';
import '@ckeditor/ckeditor5-bookmark/dist/index.css';
import './custom.css';

// CodeMirror 6 Modules
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';

/**
 * Factory helper to initialize CodeMirror 6 inside modal
 */
function createCodeEditor(parent, options = {}) {
  const isMarkdown = options.mode === 'markdown';
  const languageExtension = isMarkdown ? markdown() : html();

  const theme = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "13px",
      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      backgroundColor: "#ffffff"
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "inherit"
    },
    ".cm-gutters": {
      backgroundColor: "#ffffff",
      color: "#94a3b8",
      borderRight: "1px solid #e2e8f0",
      paddingRight: "6px"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#f1f5f9",
      color: "#0f172a"
    },
    ".cm-activeLine": {
      backgroundColor: "#f8fafc"
    },
    ".cm-content": {
      padding: "12px 14px",
      caretColor: "#0f172a"
    },
    ".cm-cursor": {
      borderLeftColor: "#0f172a"
    },
    "&.cm-focused": {
      outline: "none"
    }
  });

  const extensions = [
    basicSetup,
    languageExtension,
    keymap.of([
      indentWithTab,
      {
        key: 'Mod-s',
        run: () => {
          if (typeof options.onSave === 'function') {
            options.onSave();
            return true;
          }
          return false;
        }
      },
      {
        key: 'Escape',
        run: () => {
          if (typeof options.onEscape === 'function') {
            options.onEscape();
            return true;
          }
          return false;
        }
      }
    ]),
    theme
  ];

  if (typeof options.onChange === 'function') {
    extensions.push(EditorView.updateListener.of(update => {
      if (update.docChanged) {
        options.onChange(update.state.doc.toString());
      }
    }));
  }

  const state = EditorState.create({
    doc: options.value || '',
    extensions
  });

  const view = new EditorView({
    state,
    parent
  });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (text) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text || '' }
      });
    },
    focus: () => view.focus(),
    destroy: () => view.destroy()
  };
}

/**
 * EnhancedSourceEditing Plugin
 * Opens a modal dialog for source code editing instead of in-place DOM replacement.
 */
class EnhancedSourceEditing extends Plugin {
  static get pluginName() {
    return 'EnhancedSourceEditing';
  }

  init() {
    const editor = this.editor;
    const t = editor.locale.t;

    const createBtn = () => {
      const buttonView = new ButtonView(editor.locale);
      buttonView.set({
        label: t('Source'),
        icon: IconSource,
        tooltip: true,
        class: 'ck-source-editing-button ur-enhanced-source-editing-button'
      });

      // Automatically disable when editor is in read-only mode
      buttonView.bind('isEnabled').to(editor, 'isReadOnly', isReadOnly => !isReadOnly);

      buttonView.on('execute', () => {
        editor.fire('enhancedSourceEditing:open');
      });

      return buttonView;
    };

    // Register both aliases so configurations with either name work seamlessly
    editor.ui.componentFactory.add('enhancedSourceEditing', createBtn);
    editor.ui.componentFactory.add('sourceEditing', createBtn);
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
  ImageInsert,
  ImageInsertViaUrl,
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
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersMathematical,
  SpecialCharactersLatin,
  SpecialCharactersText,
  PageBreak,
  ShowBlocks,
  SelectAll,
  Fullscreen,
  Emoji,
  Indent,
  IndentBlock,
  PasteFromOffice,
  TextTransformation,
  AutoImage,
  PictureEditing,
  TableScroll,
  TableLayout,
  Bookmark,
  EnhancedSourceEditing,
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
      'undo',
      'redo',
      '|',
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
      '|',
      'bulletedList',
      'numberedList',
      'todoList',
      'outdent',
      'indent',
      '|',
      'link',
      'bookmark',
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
      'enhancedSourceEditing'
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
ClassicEditor.Bookmark = Bookmark;
ClassicEditor.Indent = Indent;
ClassicEditor.IndentBlock = IndentBlock;
ClassicEditor.EnhancedSourceEditing = EnhancedSourceEditing;
ClassicEditor.createCodeEditor = createCodeEditor;

export {
  ClassicEditor,
  InlineEditor,
  BalloonEditor,
  DecoupledEditor,
  Markdown,
  Fullscreen,
  Emoji,
  Bookmark,
  Indent,
  IndentBlock,
  EnhancedSourceEditing,
  createCodeEditor
};

export default ClassicEditor;
