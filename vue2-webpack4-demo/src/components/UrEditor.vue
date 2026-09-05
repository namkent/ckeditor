<template>
  <div 
    class="ckeditor5-component ur-editor-wrapper" 
    :class="[
      `mode-${resolvedEditorType}`,
      `ur-editor-type-${resolvedEditorType}`,
      `display-${mode}`,
      `ur-editor-display-${mode}`,
      { 
        'is-readonly': readonly, 
        'ur-editor-is-readonly': readonly,
        'is-toolbar-none': toolbar === 'none',
        'ur-editor-toolbar-none': toolbar === 'none',
        'is-view-mode': mode === 'view',
        'ur-editor-is-view-mode': mode === 'view',
        'ur-editor-is-fullscreen': isFullscreen
      }
    ]"
    :style="componentStyle"
  >
    <!-- VIEW MODE: Pure content display (no editor chrome, no borders, no toolbars) -->
    <div v-if="mode === 'view'" class="ck-view-mode-container ur-editor-view-container ck-content">
      <div v-if="format === 'html'" v-html="value"></div>
      <div v-else class="markdown-view-body ur-editor-markdown-view" style="white-space: pre-wrap; font-family: inherit;">{{ value }}</div>
    </div>

    <!-- EDIT MODE -->
    <template v-else>
      <!-- Decoupled Document Mode -->
      <div v-if="resolvedEditorType === 'decoupled'" class="ck-decoupled-container ur-editor-decoupled-container" :style="{ height: resolvedHeight }">
        <div v-show="toolbar !== 'none'" ref="toolbarContainer" class="ck-decoupled-toolbar ur-editor-decoupled-toolbar"></div>
        <div class="ck-decoupled-editable-wrapper ur-editor-decoupled-editable-wrapper">
          <div ref="editorContainer" class="ck-decoupled-editable ur-editor-decoupled-editable" :style="{ minHeight: resolvedHeight }"></div>
        </div>
      </div>

      <!-- Classic / Inline / Balloon Mode -->
      <div v-else class="ck-standard-wrapper ur-editor-standard-wrapper">
        <div 
          ref="editorContainer" 
          :class="{
            'ck-inline-editable': resolvedEditorType === 'inline',
            'ur-editor-inline-editable': resolvedEditorType === 'inline',
            'ck-balloon-editable': resolvedEditorType === 'balloon',
            'ur-editor-balloon-editable': resolvedEditorType === 'balloon'
          }"
        ></div>
      </div>
    </template>
  </div>
</template>

<script>
import { 
  ClassicEditor, 
  InlineEditor, 
  BalloonEditor, 
  DecoupledEditor,
  Markdown
} from '../../../ckeditor5-custom-build/dist/ckeditor.js';

export default {
  name: 'UrEditor',
  props: {
    // v-model content
    value: {
      type: String,
      default: ''
    },
    // mode: 'edit' | 'view'. Default 'edit'
    mode: {
      type: String,
      default: 'edit',
      validator: v => ['edit', 'view'].includes(v.toLowerCase())
    },
    // editor type: 'classic' | 'inline' | 'balloon' | 'decoupled'
    editor: {
      type: [String, Object, Function],
      default: 'classic',
      validator: v => {
        if (typeof v === 'string') {
          return ['classic', 'inline', 'balloon', 'decoupled'].includes(v.toLowerCase());
        }
        return true;
      }
    },
    // format: 'html' | 'markdown'
    format: {
      type: String,
      default: 'html',
      validator: v => ['html', 'markdown'].includes(v.toLowerCase())
    },
    // readonly mode: locks editing while keeping editor structure
    readonly: {
      type: Boolean,
      default: false
    },
    // source editing toggle (ONLY supported in classic mode)
    source: {
      type: Boolean,
      default: false
    },
    // toolbar preset: 'none' | 'normal' | 'full'
    toolbar: {
      type: String,
      default: 'normal',
      validator: v => ['none', 'normal', 'full'].includes(v.toLowerCase())
    },
    // custom config to override defaults
    config: {
      type: Object,
      default: () => ({})
    },
    // height: supports 'px', '%', 'vh', 'em', 'rem', etc. Default '250px'
    height: {
      type: [String, Number],
      default: '250px'
    }
  },
  data() {
    return {
      instance: null,
      lastEmittedValue: '',
      isSettingData: false,
      isDestroying: false,
      isFullscreen: false,
      pasteTimeout: null
    };
  },
  computed: {
    resolvedEditorType() {
      if (typeof this.editor === 'string') {
        return this.editor.toLowerCase();
      }
      if (this.editor === InlineEditor) return 'inline';
      if (this.editor === BalloonEditor) return 'balloon';
      if (this.editor === DecoupledEditor) return 'decoupled';
      return 'classic';
    },
    resolvedConstructor() {
      const type = this.resolvedEditorType;
      if (type === 'inline') return InlineEditor;
      if (type === 'balloon') return BalloonEditor;
      if (type === 'decoupled') return DecoupledEditor;
      if (typeof this.editor === 'function' || typeof this.editor === 'object') {
        return this.editor;
      }
      return ClassicEditor;
    },
    resolvedHeight() {
      if (!this.height) return '250px';
      return isNaN(this.height) ? this.height : `${this.height}px`;
    },
    componentStyle() {
      return {
        '--ckeditor-custom-height': this.resolvedHeight,
        '--ur-editor-custom-height': this.resolvedHeight
      };
    }
  },
  watch: {
    value(newVal) {
      if (this.instance && !this.isSettingData && this.mode === 'edit') {
        const currentData = this.instance.getData();
        if (newVal !== currentData && newVal !== this.lastEmittedValue) {
          this.isSettingData = true;
          this.instance.setData(newVal || '');
          this.$nextTick(() => {
            this.isSettingData = false;
          });
        }
      }
    },
    mode(newVal) {
      if (newVal === 'view') {
        this.destroyEditor();
      } else {
        this.$nextTick(() => {
          this.initEditor();
        });
      }
    },
    readonly(newVal) {
      if (this.instance) {
        this.updateReadOnly(newVal);
      }
    },
    editor() {
      if (this.mode === 'edit') this.reinitEditor();
    },
    format() {
      if (this.mode === 'edit') this.reinitEditor();
    },
    toolbar() {
      if (this.mode === 'edit') this.reinitEditor();
    },
    source() {
      if (this.mode === 'edit') this.reinitEditor();
    }
  },
  mounted() {
    if (this.mode === 'edit') {
      this.initEditor();
    }
  },
  beforeDestroy() {
    if (this.pasteTimeout) {
      clearTimeout(this.pasteTimeout);
    }
    this.destroyEditor();
  },
  methods: {
    getToolbarItems() {
      if (this.toolbar === 'none') {
        return [];
      }

      let items = [];
      if (this.toolbar === 'full') {
        items = [
          'undo',
          'redo',
          '|',
          'heading',
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
          'selectAll'
        ];
      } else {
        // 'normal' default
        items = [
          'undo',
          'redo',
          '|',
          'heading',
          'fontFamily',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          '|',
          'link',
          'insertImage',
          'insertTable',
          'blockQuote',
          'emoji',
          '|',
          'bulletedList',
          'numberedList',
          'outdent',
          'indent'
        ];
      }

      // Nút sourceEditing hỗ trợ trong Classic Editor và Decoupled Editor khi bật prop source
      const supportsSource = this.resolvedEditorType === 'classic' || this.resolvedEditorType === 'decoupled';
      if (this.source && supportsSource && !items.includes('sourceEditing')) {
        items.push('|', 'sourceEditing');
      }

      // Nút fullscreen chỉ hỗ trợ Classic và Decoupled (tắt ở Inline và Balloon để tránh lỗi giao diện)
      const supportsFullscreen = this.resolvedEditorType === 'classic' || this.resolvedEditorType === 'decoupled';
      if (supportsFullscreen && !items.includes('fullscreen')) {
        items.push('|', 'fullscreen');
      }

      return items;
    },

    buildConfig() {
      const baseConfig = Object.assign({}, this.config);
      const supportsFullscreen = this.resolvedEditorType === 'classic' || this.resolvedEditorType === 'decoupled';

      // License Key & Clean PoweredBy
      if (!baseConfig.licenseKey) {
        baseConfig.licenseKey = 'GPL';
      }
      if (!baseConfig.ui) {
        baseConfig.ui = {
          poweredBy: {
            position: 'inside',
            side: 'right',
            label: ''
          }
        };
      }

      // Loại bỏ plugin Fullscreen ở mode inline và balloon để tránh lỗi giao diện
      if (!supportsFullscreen) {
        const removePlugins = baseConfig.removePlugins ? [...baseConfig.removePlugins] : [];
        if (!removePlugins.includes('Fullscreen')) {
          removePlugins.push('Fullscreen');
        }
        baseConfig.removePlugins = removePlugins;
      }

      // Đăng ký Markdown nếu format = markdown
      if (this.format.toLowerCase() === 'markdown' && Markdown) {
        const extraPlugins = baseConfig.extraPlugins ? [...baseConfig.extraPlugins] : [];
        if (!extraPlugins.includes(Markdown)) {
          extraPlugins.push(Markdown);
        }
        baseConfig.extraPlugins = extraPlugins;
      }

      // Cấu hình Toolbar
      if (!baseConfig.toolbar || !baseConfig.toolbar.items) {
        const toolbarItems = this.getToolbarItems();
        baseConfig.toolbar = Object.assign({}, baseConfig.toolbar, {
          items: toolbarItems,
          shouldNotGroupWhenFull: true
        });
      } else if (!supportsFullscreen && Array.isArray(baseConfig.toolbar.items)) {
        baseConfig.toolbar = Object.assign({}, baseConfig.toolbar, {
          items: baseConfig.toolbar.items.filter(item => item !== 'fullscreen')
        });
      }

      return baseConfig;
    },

    async initEditor() {
      if (this.mode === 'view') return;

      const editorClass = this.resolvedConstructor;
      if (!editorClass || !editorClass.create) {
        console.error('[UrEditor] Invalid editor constructor.');
        return;
      }

      const container = this.$refs.editorContainer;
      if (!container) return;

      const finalConfig = this.buildConfig();

      try {
        const editor = await editorClass.create(container, finalConfig);
        this.instance = editor;

        // Decoupled Editor: Gắn toolbar vào container riêng
        if (this.resolvedEditorType === 'decoupled' && this.$refs.toolbarContainer) {
          this.$refs.toolbarContainer.innerHTML = '';
          if (this.toolbar !== 'none') {
            this.$refs.toolbarContainer.appendChild(editor.ui.view.toolbar.element);
          }
        }

        // Set initial data
        if (this.value) {
          this.isSettingData = true;
          editor.setData(this.value);
          this.isSettingData = false;
        }

        // Apply readonly
        if (this.readonly) {
          this.updateReadOnly(true);
        }

        // Lắng nghe sự kiện toggle fullscreen từ command / plugin
        const fsCmd = editor.commands && (editor.commands.get('toggleFullscreen') || editor.commands.get('fullscreen'));
        if (fsCmd) {
          fsCmd.on('change:value', (evt, name, val) => {
            this.isFullscreen = !!val;
            this.$emit('fullscreen-change', this.isFullscreen);
          });
        }

        // Hỗ trợ SourceEditing cho DecoupledEditor (do CKEditor mặc định chỉ tự động kích hoạt cho ClassicEditor)
        const sePlugin = editor.plugins.has('SourceEditing') && editor.plugins.get('SourceEditing');
        if (sePlugin && this.resolvedEditorType === 'decoupled') {
          sePlugin.on('change:isSourceEditingMode', (evt, name, isSourceEditingMode) => {
            if (isSourceEditingMode) {
              if (typeof sePlugin._hideVisibleDialog === 'function') sePlugin._hideVisibleDialog();
              if (typeof sePlugin._showSourceEditing === 'function') sePlugin._showSourceEditing();
              if (typeof sePlugin._disableCommands === 'function') sePlugin._disableCommands();
            } else {
              if (typeof sePlugin._hideSourceEditing === 'function') sePlugin._hideSourceEditing();
              if (typeof sePlugin._enableCommands === 'function') sePlugin._enableCommands();
            }
          });
          sePlugin.on('change:isEnabled', (evt, name, isEnabled) => {
            if (typeof sePlugin._handleReadOnlyMode === 'function') {
              sePlugin._handleReadOnlyMode(!isEnabled);
            }
          });
          editor.on('change:isReadOnly', (evt, name, isReadOnly) => {
            if (typeof sePlugin._handleReadOnlyMode === 'function') {
              sePlugin._handleReadOnlyMode(isReadOnly);
            }
          });
        }

        // Data change listener
        editor.model.document.on('change:data', () => {
          if (this.isSettingData || this.isDestroying) return;
          const data = editor.getData();
          this.lastEmittedValue = data;
          this.$emit('input', data);
        });

        // Event hooks & Clipboard
        const editingView = editor.editing.view;
        editingView.document.on('focus', (event) => {
          this.$emit('focus', event, editor);
        });

        editingView.document.on('blur', (event) => {
          this.$emit('blur', event, editor);
        });

        editingView.document.on('clipboardInput', () => {
          if (this.pasteTimeout) clearTimeout(this.pasteTimeout);
          this.pasteTimeout = setTimeout(() => {
            if (this.instance) {
              const data = this.instance.getData();
              this.lastEmittedValue = data;
              this.$emit('input', data);
            }
          }, 100);
        });

        this.$emit('ready', editor);
      } catch (err) {
        console.error('[UrEditor] Initialization error:', err);
        this.$emit('error', err);
      }
    },

    updateReadOnly(isReadOnly) {
      if (!this.instance) return;
      const readOnlyLockId = 'ur-editor-readonly-lock';
      if (typeof this.instance.enableReadOnlyMode === 'function') {
        if (isReadOnly) {
          this.instance.enableReadOnlyMode(readOnlyLockId);
        } else {
          this.instance.disableReadOnlyMode(readOnlyLockId);
        }
      } else {
        this.instance.isReadOnly = isReadOnly;
      }
    },

    async destroyEditor() {
      if (this.instance) {
        this.isDestroying = true;
        const editor = this.instance;
        this.instance = null;
        try {
          await editor.destroy();
          this.$emit('destroy', editor);
        } catch (err) {
          console.error('[UrEditor] Error destroying instance:', err);
        } finally {
          this.isDestroying = false;
        }
      }
    },

    async reinitEditor() {
      await this.destroyEditor();
      await this.$nextTick();
      await this.initEditor();
    }
  }
};
</script>

<style lang="scss">
.ckeditor5-component,
.ur-editor-wrapper {
  width: 100%;
  position: relative;
  box-sizing: border-box;

  /* 1. Classic Editor: Chiều cao & Cuộn cho WYSIWYG & Source Editing */
  &.mode-classic,
  &.ur-editor-type-classic {
    .ck-editor__main > .ck-editor__editable:not(.ck-editor__nested-editable) {
      min-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      max-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      overflow-y: auto !important;
      box-sizing: border-box !important;
    }

    /* Đảm bảo các ô trong bảng (nested editables) không bị gán chiều cao của editor */
    .ck-editor__nested-editable {
      min-height: unset !important;
      max-height: unset !important;
      height: auto !important;
      overflow-y: visible !important;
    }

    /* Khóa chiều cao cho chế độ edit source (textarea) bằng đúng chiều cao editor */
    .ck-source-editing-area {
      min-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      max-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      overflow: hidden !important;
      box-sizing: border-box !important;

      textarea {
        min-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
        max-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
        height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
        overflow-y: auto !important;
        box-sizing: border-box !important;
        resize: none !important;
        padding: 16px !important;
        font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        font-size: 13.5px !important;
        line-height: 1.6 !important;
      }
    }
  }

  /* 2. Decoupled Mode */
  &.mode-decoupled,
  &.ur-editor-type-decoupled {
    .ck-decoupled-container,
    .ur-editor-decoupled-container {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden;
      background: #f8fafc;
    }

    .ck-decoupled-toolbar,
    .ur-editor-decoupled-toolbar {
      border-bottom: 1px solid #cbd5e1;
      background: #ffffff;
    }

    .ck-decoupled-editable-wrapper,
    .ur-editor-decoupled-editable-wrapper {
      overflow-y: auto !important;
      max-height: calc(var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) - 42px) !important;
      padding: 24px;
    }

    /* Decoupled Source Editing */
    .ck-source-editing-area {
      width: 100% !important;
      max-width: 850px !important;
      min-height: 400px !important;
      background: #ffffff !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 4px !important;
      box-sizing: border-box !important;

      textarea {
        min-height: 400px !important;
        padding: 40px !important;
        box-sizing: border-box !important;
        font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        font-size: 13.5px !important;
        line-height: 1.6 !important;
        resize: none !important;
      }
    }
  }

  /* 3. Read-only State */
  &.is-readonly,
  &.ur-editor-is-readonly {
    .ck-editor__editable {
      background-color: #f8fafc !important;
      cursor: default !important;
    }

    .ck-toolbar {
      pointer-events: none !important;
      opacity: 0.55 !important;

      button,
      .ck-dropdown {
        pointer-events: none !important;
      }
    }
  }

  /* 4. View Mode */
  &.is-view-mode,
  &.ur-editor-is-view-mode {
    border: none !important;
    background: transparent !important;
  }

  .ck-view-mode-container,
  .ur-editor-view-container {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
  }

  /* 5. Source Editing Button (ẩn text label, chỉ giữ icon) */
  .ck.ck-button.ck-source-editing-button .ck-button__label {
    display: none !important;
  }

  /* 6. Table Formatting Cleanup */
  .ck-content .table table td,
  .ck-content .table table th {
    overflow: visible !important;
    scrollbar-width: none !important;
  }

  /* 7. Hide CKEditor 5 Powered-By Logo & Watermarks */
  .ck.ck-powered-by,
  .ck-powered-by,
  .ck.ck-balloon-panel.ck-powered-by-balloon,
  .ck-powered-by-balloon {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
  }
}
</style>