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
  ButtonView,
  FileRepository
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
function CodeEditor(parent, options = {}) {
  const isMarkdown = options.mode === 'markdown';
  const languageExtension = isMarkdown ? markdown() : html();

  const theme = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "13px",
      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      backgroundColor: "#ffffff",
      color: "#0f172a"
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "inherit"
    },
    ".cm-gutters": {
      backgroundColor: "#ffffff",
      color: "#64748b",
      borderRight: "1px solid #e2e8f0",
      paddingRight: "6px",
      userSelect: "none",
      WebkitUserSelect: "none"
    },
    ".cm-gutterElement": {
      userSelect: "none",
      WebkitUserSelect: "none"
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
      caretColor: "#0f172a",
      color: "#0f172a"
    },
    ".cm-line": {
      color: "#0f172a"
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

/**
 * AutoCompressUploadAdapter
 * Automatically compresses and resizes oversized images on the client side using HTML5 Canvas
 * before resolving to Base64 (or sending to server if configured).
 * 
 * Guards & Rules:
 * 1. Animated GIF ('image/gif') is passed through untouched to preserve frames and animation.
 * 2. Small images (<= 300KB and width <= 1600 && height <= 1600) are passed through untouched.
 * 3. Transparent PNGs preserve 'image/png' format so transparency is never lost.
 * 4. JPEGs/other images are resized to max 1600x1600 and compressed with quality 0.82.
 * 5. Fail-safe: If compressed base64 length >= original length, original is kept.
 */
class AutoCompressUploadAdapter {
  constructor(loader, options = {}) {
    this.loader = loader;
    this.options = Object.assign({
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.82,
      sizeThreshold: 300 * 1024 // 300KB
    }, options);
  }

  upload() {
    return this.loader.file.then(file => {
      return new Promise((resolve, reject) => {
        if (!file) {
          return reject(new Error('No file provided to upload adapter'));
        }

        // 1. Guard: Animated GIF -> keep 100% original
        if (file.type === 'image/gif') {
          return this._readAsBase64(file).then(dataUrl => resolve({ default: dataUrl })).catch(reject);
        }

        // 2. Guard: Non-raster or SVG -> keep original
        if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
          return this._readAsBase64(file).then(dataUrl => resolve({ default: dataUrl })).catch(reject);
        }

        const reader = new FileReader();
        reader.onload = () => {
          const originalDataUrl = reader.result;

          const img = new Image();
          img.onload = () => {
            // 3. Guard: Check if size and dimensions are already small -> skip compression
            const isSizeSmall = file.size <= this.options.sizeThreshold;
            const isDimensionSmall = img.naturalWidth <= this.options.maxWidth && img.naturalHeight <= this.options.maxHeight;

            if (isSizeSmall && isDimensionSmall) {
              return resolve({ default: originalDataUrl });
            }

            try {
              let width = img.naturalWidth;
              let height = img.naturalHeight;

              if (width > this.options.maxWidth || height > this.options.maxHeight) {
                const ratio = Math.min(this.options.maxWidth / width, this.options.maxHeight / height);
                width = Math.max(1, Math.round(width * ratio));
                height = Math.max(1, Math.round(height * ratio));
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');

              ctx.drawImage(img, 0, 0, width, height);

              const isPng = file.type === 'image/png';
              const outputType = isPng ? 'image/png' : 'image/jpeg';
              const quality = isPng ? undefined : this.options.quality;

              const compressedDataUrl = canvas.toDataURL(outputType, quality);

              if (compressedDataUrl && compressedDataUrl.length < originalDataUrl.length) {
                resolve({ default: compressedDataUrl });
              } else {
                resolve({ default: originalDataUrl });
              }
            } catch (canvasErr) {
              resolve({ default: originalDataUrl });
            }
          };

          img.onerror = () => resolve({ default: originalDataUrl });
          img.src = originalDataUrl;
        };

        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });
    });
  }

  abort() {
    // Local processing, no server request to cancel
  }

  _readAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * AutoCompressUploadAdapterPlugin
 * Replaces Base64UploadAdapter with our smart AutoCompressUploadAdapter.
 */
class AutoCompressUploadAdapterPlugin extends Plugin {
  static get pluginName() {
    return 'AutoCompressUploadAdapter';
  }

  static get requires() {
    return [FileRepository];
  }

  init() {
    const options = this.editor.config.get('imageCompression') || {};
    this.editor.plugins.get(FileRepository).createUploadAdapter = loader => {
      return new AutoCompressUploadAdapter(loader, options);
    };
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
  AutoCompressUploadAdapterPlugin,
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
      'linkImage',
      '|',
      'resizeImage'
    ],
    resizeOptions: [
      {
        name: 'resizeImage:original',
        value: null,
        icon: 'original'
      },
      {
        name: 'resizeImage:25',
        value: '25',
        icon: 'small'
      },
      {
        name: 'resizeImage:50',
        value: '50',
        icon: 'medium'
      },
      {
        name: 'resizeImage:75',
        value: '75',
        icon: 'large'
      }
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

// Helper to deep-clone a config object while preserving RegExp instances.
// JSON.parse(JSON.stringify(...)) silently destroys RegExp values (e.g. name: /.*/ → name: {}),
// breaking GeneralHtmlSupport which needs a real regex to match element names.
function deepCloneConfig(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof RegExp) return value; // preserve regex as-is
  if (Array.isArray(value)) return value.map(deepCloneConfig);
  const cloned = {};
  for (const key of Object.keys(value)) {
    cloned[key] = deepCloneConfig(value[key]);
  }
  return cloned;
}

// Helper to wrap create method
function wrapEditorClass(BaseClass) {
  class CustomEditor extends BaseClass {}
  CustomEditor.builtinPlugins = [...builtinPlugins];
  CustomEditor.defaultConfig = deepCloneConfig(defaultConfig);
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
ClassicEditor.CodeEditor = CodeEditor;
ClassicEditor.AutoCompressUploadAdapter = AutoCompressUploadAdapterPlugin;

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
  CodeEditor,
  AutoCompressUploadAdapterPlugin as AutoCompressUploadAdapter
};

export default ClassicEditor;
