<template>
  <div 
    class="ckeditor5-component" 
    :class="[
      `mode-${resolvedEditorType}`,
      `display-${mode}`,
      { 
        'is-readonly': readonly, 
        'is-toolbar-none': toolbar === 'none',
        'is-view-mode': mode === 'view'
      }
    ]"
    :style="componentStyle"
  >
    <!-- VIEW MODE: Pure content display (no editor chrome, no borders, no toolbars) -->
    <div v-if="mode === 'view'" class="ck-view-mode-container ck-content">
      <div v-if="format === 'html'" v-html="value"></div>
      <div v-else class="markdown-view-body" style="white-space: pre-wrap; font-family: inherit;">{{ value }}</div>
    </div>

    <!-- EDIT MODE -->
    <template v-else>
      <!-- Decoupled Document Mode -->
      <div v-if="resolvedEditorType === 'decoupled'" class="ck-decoupled-container" :style="{ height: resolvedHeight }">
        <div v-show="toolbar !== 'none'" ref="toolbarContainer" class="ck-decoupled-toolbar"></div>
        <div class="ck-decoupled-editable-wrapper">
          <div ref="editorContainer" class="ck-decoupled-editable" :style="{ minHeight: resolvedHeight }"></div>
        </div>
      </div>

      <!-- Classic / Inline / Balloon Mode -->
      <div v-else class="ck-standard-wrapper">
        <div 
          ref="editorContainer" 
          :class="{
            'ck-inline-editable': resolvedEditorType === 'inline',
            'ck-balloon-editable': resolvedEditorType === 'balloon'
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
  name: 'CKEditor5',
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
    // source editing toggle (for admin - ONLY supported in classic mode)
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
      type: String,
      default: '250px'
    }
  },
  data() {
    return {
      instance: null,
      lastEmittedValue: '',
      isSettingData: false,
      isDestroying: false
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
        '--ckeditor-custom-height': this.resolvedHeight
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
          '|',
          'undo',
          'redo'
        ];
      } else {
        // 'normal' default
        items = [
          'heading',
          '|',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          '|',
          'link',
          'bulletedList',
          'numberedList',
          'insertTable',
          'blockQuote',
          '|',
          'undo',
          'redo'
        ];
      }

      // Add sourceEditing button ONLY for classic mode when source prop is enabled
      if (this.source && this.resolvedEditorType === 'classic' && !items.includes('sourceEditing')) {
        items.push('|', 'sourceEditing');
      }

      // Add fullscreen at the VERY END of the toolbar items list
      if (!items.includes('fullscreen')) {
        items.push('|', 'fullscreen');
      }

      return items;
    },

    buildConfig() {
      const baseConfig = Object.assign({}, this.config);

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

      // Toolbar configuration
      if (!baseConfig.toolbar || !baseConfig.toolbar.items) {
        const toolbarItems = this.getToolbarItems();
        baseConfig.toolbar = Object.assign({}, baseConfig.toolbar, {
          items: toolbarItems,
          shouldNotGroupWhenFull: true
        });
      }

      // Only add Markdown as extraPlugin if format is markdown
      if (this.format.toLowerCase() === 'markdown') {
        const extraPlugins = baseConfig.extraPlugins ? [...baseConfig.extraPlugins] : [];
        if (!extraPlugins.includes(Markdown)) {
          extraPlugins.push(Markdown);
        }
        baseConfig.extraPlugins = extraPlugins;
      }

      return baseConfig;
    },

    async initEditor() {
      if (this.mode === 'view') return;

      const editorClass = this.resolvedConstructor;
      if (!editorClass || !editorClass.create) {
        console.error('[CKEditor 5] Invalid editor constructor.');
        return;
      }

      const container = this.$refs.editorContainer;
      if (!container) return;

      const finalConfig = this.buildConfig();

      try {
        const editor = await editorClass.create(container, finalConfig);
        this.instance = editor;

        // For Decoupled Editor, attach toolbar to designated container
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

        // Apply initial readonly state
        if (this.readonly) {
          this.updateReadOnly(true);
        }

        // Data change listener
        editor.model.document.on('change:data', () => {
          if (this.isSettingData || this.isDestroying) return;
          const data = editor.getData();
          this.lastEmittedValue = data;
          this.$emit('input', data);
        });

        // Event hooks
        editor.editing.view.document.on('focus', (event) => {
          this.$emit('focus', event, editor);
        });

        editor.editing.view.document.on('blur', (event) => {
          this.$emit('blur', event, editor);
        });

        this.$emit('ready', editor);
      } catch (err) {
        console.error('[CKEditor 5] Initialization error:', err);
        this.$emit('error', err);
      }
    },

    updateReadOnly(isReadOnly) {
      if (!this.instance) return;
      const readOnlyLockId = 'vue2-ckeditor-readonly-lock';
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
          console.error('[CKEditor 5] Error destroying instance:', err);
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

<style>
.ckeditor5-component {
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

/* Height config for Classic Editor */
.ckeditor5-component.mode-classic .ck-editor__editable {
  min-height: var(--ckeditor-custom-height, 250px) !important;
  max-height: var(--ckeditor-custom-height, 250px) !important;
  overflow-y: auto !important;
}

/* Decoupled Mode */
.ckeditor5-component.mode-decoupled .ck-decoupled-container {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  overflow: hidden;
  background: #f8fafc;
}

.ckeditor5-component.mode-decoupled .ck-decoupled-toolbar {
  border-bottom: 1px solid #cbd5e1;
  background: #ffffff;
}

.ckeditor5-component.mode-decoupled .ck-decoupled-editable-wrapper {
  overflow-y: auto;
  max-height: calc(var(--ckeditor-custom-height, 250px) - 42px);
  padding: 24px;
}

/* Read-only appearance & disable toolbar buttons in readonly mode */
.ckeditor5-component.is-readonly .ck-editor__editable {
  background-color: #f8fafc !important;
  cursor: default !important;
}

.ckeditor5-component.is-readonly .ck-toolbar,
.ckeditor5-component.is-readonly .ck-toolbar button,
.ckeditor5-component.is-readonly .ck-toolbar .ck-dropdown {
  pointer-events: none !important;
  opacity: 0.55 !important;
}

/* View Mode */
.ckeditor5-component.is-view-mode {
  border: none !important;
  background: transparent !important;
}
.ckeditor5-component .ck-view-mode-container {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
}

/* Source editing: display only icon */
.ck.ck-button.ck-source-editing-button .ck-button__label {
  display: none !important;
}

/* Table clean formatting */
.ck-content .table table td,
.ck-content .table table th {
  overflow: visible !important;
  scrollbar-width: none !important;
}

/* Hide CKEditor 5 Powered-By Logo */
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
</style>
