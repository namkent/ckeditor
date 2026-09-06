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
        'ur-editor-is-fullscreen': isFullscreen,
        'is-source-mode': isSourceEditing,
        'ur-editor-is-source-mode': isSourceEditing
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

    <!-- ENHANCED SOURCE EDITING MODAL DIALOG -->
    <div 
      v-if="isSourceModalOpen" 
      ref="sourceModalOverlay"
      class="ur-source-modal-overlay"
      @click.self="closeSourceModal"
      @keydown.esc="closeSourceModal"
    >
      <div class="ur-source-modal" role="dialog" aria-modal="true" aria-labelledby="ur-source-modal-title">
        <!-- Modal Header -->
        <div class="ur-source-modal-header">
          <h3 id="ur-source-modal-title" class="ur-source-modal-title">Edit source</h3>
          <button 
            type="button" 
            class="ur-source-modal-close-btn" 
            aria-label="Close" 
            title="Close"
            @click="closeSourceModal"
          >
            âœ•
          </button>
        </div>

        <!-- Modal Body: CodeMirror 6 Code Editor -->
        <div class="ur-source-modal-body">
          <div ref="sourceEditorContainer" class="ur-source-modal-codemirror"></div>
        </div>

        <!-- Modal Footer: Cancel & Save -->
        <div class="ur-source-modal-footer">
          <button 
            type="button" 
            class="ur-source-modal-btn ur-source-modal-btn-cancel" 
            @click="closeSourceModal"
          >
            Cancel
          </button>
          <button 
            type="button" 
            class="ur-source-modal-btn ur-source-modal-btn-save" 
            @click="saveSourceModal"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  ClassicEditor, 
  InlineEditor, 
  BalloonEditor, 
  DecoupledEditor,
  Markdown,
  createCodeEditor
} from './dist/ckeditor.js';

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
      isSourceModalOpen: false,
      sourceModalContent: '',
      codeEditorInstance: null,
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
    const overlay = this.$refs.sourceModalOverlay;
    if (overlay && overlay.parentNode === document.body) {
      overlay.parentNode.removeChild(overlay);
    }
    if (this.codeEditorInstance) {
      this.codeEditorInstance.destroy();
      this.codeEditorInstance = null;
    }
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

      // NÃºt sourceEditing / enhancedSourceEditing há»— trá»£ khi báº­t prop source
      const supportsSource = this.resolvedEditorType === 'classic' || this.resolvedEditorType === 'decoupled';
      if (this.source && supportsSource && !items.includes('enhancedSourceEditing') && !items.includes('sourceEditing')) {
        items.push('|', 'enhancedSourceEditing');
      }

      // NÃºt fullscreen chá»‰ há»— trá»£ Classic vÃ  Decoupled (táº¯t á»Ÿ Inline vÃ  Balloon Ä‘á»ƒ trÃ¡nh lá»—i giao diá»‡n)
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

      // Loáº¡i bá» plugin Fullscreen á»Ÿ mode inline vÃ  balloon Ä‘á»ƒ trÃ¡nh lá»—i giao diá»‡n
      if (!supportsFullscreen) {
        const removePlugins = baseConfig.removePlugins ? [...baseConfig.removePlugins] : [];
        if (!removePlugins.includes('Fullscreen')) {
          removePlugins.push('Fullscreen');
        }
        baseConfig.removePlugins = removePlugins;
      }

      // ÄÄƒng kÃ½ Markdown náº¿u format = markdown
      if (this.format.toLowerCase() === 'markdown' && Markdown) {
        const extraPlugins = baseConfig.extraPlugins ? [...baseConfig.extraPlugins] : [];
        if (!extraPlugins.includes(Markdown)) {
          extraPlugins.push(Markdown);
        }
        baseConfig.extraPlugins = extraPlugins;
      }

      // Cáº¥u hÃ¬nh Toolbar
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

        // Decoupled Editor: Gáº¯n toolbar vÃ o container riÃªng
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

        // Láº¯ng nghe sá»± kiá»‡n toggle fullscreen tá»« command / plugin
        const fsCmd = editor.commands && (editor.commands.get('toggleFullscreen') || editor.commands.get('fullscreen'));
        if (fsCmd) {
          fsCmd.on('change:value', (evt, name, val) => {
            this.isFullscreen = !!val;
            this.$emit('fullscreen-change', this.isFullscreen);
          });
        }

        // Láº¯ng nghe sá»± kiá»‡n má»Ÿ popup Edit Source tá»« plugin EnhancedSourceEditing
        editor.on('enhancedSourceEditing:open', () => {
          this.openSourceModal();
        });

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
    },

    formatHtml(html) {
      if (!html) return '';
      let formatted = '';
      let indent = 0;
      const tab = '  ';
      const tokens = html.replace(/>\s*</g, '><').match(/(<[^>]+>|[^<]+)/g) || [];
      const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        if (!token) continue;

        if (token.startsWith('</')) {
          indent = Math.max(0, indent - 1);
          formatted += tab.repeat(indent) + token + '\n';
        } else if (token.startsWith('<') && !token.startsWith('<!')) {
          const isSelfClosing = token.endsWith('/>') || voidTags.some(tag => new RegExp(`^<${tag}(\\s|>|$)`, 'i').test(token));
          formatted += tab.repeat(indent) + token + '\n';
          if (!isSelfClosing) {
            indent++;
          }
        } else {
          formatted += tab.repeat(indent) + token + '\n';
        }
      }
      return formatted.trim();
    },

    openSourceModal() {
      if (!this.instance) return;
      let content = this.instance.getData() || '';
      if (this.format && this.format.toLowerCase() === 'html') {
        content = this.formatHtml(content);
      }
      this.sourceModalContent = content;
      this.isSourceModalOpen = true;

      this.$nextTick(() => {
        const overlay = this.$refs.sourceModalOverlay;
        if (overlay && overlay.parentNode !== document.body) {
          document.body.appendChild(overlay);
        }

        const container = this.$refs.sourceEditorContainer;
        if (!container) return;

        if (this.codeEditorInstance) {
          this.codeEditorInstance.destroy();
          this.codeEditorInstance = null;
        }

        container.innerHTML = '';
        if (typeof createCodeEditor === 'function') {
          this.codeEditorInstance = createCodeEditor(container, {
            value: this.sourceModalContent,
            mode: this.format.toLowerCase() === 'markdown' ? 'markdown' : 'html',
            onChange: (newVal) => {
              this.sourceModalContent = newVal;
            },
            onSave: () => {
              this.saveSourceModal();
            },
            onEscape: () => {
              this.closeSourceModal();
            }
          });

          setTimeout(() => {
            if (this.codeEditorInstance) {
              this.codeEditorInstance.focus();
            }
          }, 60);
        }
      });

      this.$emit('source-modal-open');
    },

    closeSourceModal() {
      const overlay = this.$refs.sourceModalOverlay;
      if (overlay && overlay.parentNode === document.body && this.$el) {
        this.$el.appendChild(overlay);
      }
      if (this.codeEditorInstance) {
        this.codeEditorInstance.destroy();
        this.codeEditorInstance = null;
      }
      this.isSourceModalOpen = false;
      this.sourceModalContent = '';
      if (this.instance && this.instance.editing && this.instance.editing.view) {
        this.instance.editing.view.focus();
      }
      this.$emit('source-modal-close');
    },

    saveSourceModal() {
      if (!this.instance) return;
      const newContent = this.codeEditorInstance ? this.codeEditorInstance.getValue() : this.sourceModalContent;
      this.isSettingData = true;
      this.instance.setData(newContent);
      this.lastEmittedValue = newContent;
      this.$emit('input', newContent);
      this.$nextTick(() => {
        this.isSettingData = false;
        this.closeSourceModal();
      });
    },

    openSourceEditing() {
      this.openSourceModal();
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

  /* Elevated z-index when Fullscreen mode is active */
  &.ur-editor-is-fullscreen,
  &.is-fullscreen {
    z-index: 100005 !important;
  }

  /* 1. Classic Editor: Chiá»u cao & Cuá»™n cho WYSIWYG & Source Editing */
  &.mode-classic,
  &.ur-editor-type-classic {
    .ck-editor__main > .ck-editor__editable:not(.ck-editor__nested-editable) {
      min-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      max-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 250px)) !important;
      overflow-y: auto !important;
      box-sizing: border-box !important;
    }

    /* Äáº£m báº£o cÃ¡c Ã´ trong báº£ng (nested editables) khÃ´ng bá»‹ gÃ¡n chiá»u cao cá»§a editor */
    .ck-editor__nested-editable {
      min-height: unset !important;
      max-height: unset !important;
      height: auto !important;
      overflow-y: visible !important;
    }
  }

  /* 2. Decoupled Mode */
  &.mode-decoupled,
  &.ur-editor-type-decoupled {
    .ck-decoupled-container,
    .ur-editor-decoupled-container {
      width: 100%;
      height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 340px));
      max-height: var(--ckeditor-custom-height, var(--ur-editor-custom-height, 340px));
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden !important;
      background: #f8fafc;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      position: relative;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    /* Bá» bo viá»n dÃ y á»Ÿ toolbar Decoupled (xÃ³a border cá»§a .ck-toolbar bÃªn trong Ä‘á»ƒ trÃ¡nh double border) */
    .ck-decoupled-toolbar,
    .ur-editor-decoupled-toolbar {
      border-bottom: 1px solid #cbd5e1 !important;
      background: #ffffff !important;
      flex-shrink: 0 !important;
      padding: 0 !important;
      margin: 0 !important;

      .ck.ck-toolbar {
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    }

    /* VÃ¹ng cuá»™n bÃªn trong cho Decoupled: Giá»›i háº¡n chiá»u cao tuyá»‡t Ä‘á»‘i, khÃ´ng Ä‘á»ƒ trÃ n ra ngoÃ i */
    .ck-decoupled-editable-wrapper,
    .ur-editor-decoupled-editable-wrapper {
      flex: 1 1 0px !important;
      min-height: 0 !important;
      height: 100% !important;
      max-height: 100% !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 24px;
      background: #f8fafc;
      display: flex !important;
      justify-content: center !important;
      box-sizing: border-box !important;
    }

    .ck-decoupled-editable,
    .ur-editor-decoupled-editable {
      width: 100%;
      max-width: 850px;
      min-height: 100%;
      background: #ffffff;
      padding: 40px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      border-radius: 2px;
      box-sizing: border-box;
      outline: none;
      overflow: visible !important;
      overflow-y: visible !important;
      height: auto !important;
      max-height: none !important;
      margin-bottom: 24px;

      &.ck-focused {
        border: 1px solid var(--ck-color-focus-border, #2977ff) !important;
        box-shadow: 0 0 0 3px var(--ck-color-focus-outer-shadow, #cae1fc) !important;
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

  /* 5. Source Editing Button (áº©n text label, chá»‰ giá»¯ icon) */
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

  /* 8. Heading Dropdown Disabled State */
  .ck.ck-dropdown.ck-heading-dropdown.ck-disabled .ck-dropdown__button::before,
  .ck.ck-dropdown.ck-heading-dropdown .ck-dropdown__button.ck-disabled::before,
  .ck.ck-dropdown.ck-heading-dropdown .ck-dropdown__button[aria-disabled="true"]::before {
    opacity: var(--ck-disabled-opacity, 0.5) !important;
  }
}

/* =============================================
   ENHANCED SOURCE EDITING MODAL DIALOG
   ============================================= */
.ur-source-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1000001 !important; /* LuÃ´n ná»•i trÃªn fullscreen (--ck-z-fullscreen: 10000, --ck-z-dialog: 100000) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  animation: urModalFadeIn 0.15s ease-out;
}

@keyframes urModalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ur-source-modal {
  width: 92vw;
  max-width: 1020px;
  height: 85vh;
  max-height: 720px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  animation: urModalScaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes urModalScaleIn {
  from { transform: scale(0.96); opacity: 0.8; }
  to { transform: scale(1); opacity: 1; }
}

.ur-source-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.ur-source-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.ur-source-modal-close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 18px;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
}

.ur-source-modal-body {
  flex: 1 1 0px;
  min-height: 0;
  display: flex;
  position: relative;
  background: #ffffff;
  overflow: hidden;
}

.ur-source-modal-codemirror {
  width: 100%;
  height: 100%;
  flex: 1 1 0px;
  min-height: 0;
  position: relative;
  display: flex;

  .cm-editor {
    width: 100%;
    height: 100%;
  }
}

.ur-source-modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.ur-source-modal-btn {
  font-size: 14px;
  font-weight: 500;
  border-radius: 5px;
  padding: 8px 20px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &-cancel {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;

    &:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      color: #0f172a;
    }
  }

  &-save {
    background: #2baa3a;
    border: 1px solid #2baa3a;
    color: #ffffff;

    &:hover {
      background: #238e30;
      border-color: #238e30;
      box-shadow: 0 2px 6px rgba(43, 170, 58, 0.35);
    }
  }
}
</style>