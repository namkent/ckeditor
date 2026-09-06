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
        'is-source-mode': isSourceModalOpen,
        'ur-editor-is-source-mode': isSourceModalOpen,
        'has-custom-height': !!resolvedHeight,
        'has-custom-min-height': !!resolvedMinHeight
      }
    ]"
    :style="wrapperStyle"
  >
    <!-- VIEW MODE: Pure content display (no editor chrome, no borders, no toolbars) -->
    <div v-if="mode === 'view'" class="ck-view-mode-container ur-editor-view-container ck-content">
      <div v-if="format === 'html'" v-html="value"></div>
      <div v-else class="markdown-view-body ur-editor-markdown-view" style="white-space: pre-wrap; font-family: inherit;">{{ value }}</div>
    </div>

    <!-- EDIT MODE -->
    <template v-else>
      <!-- Decoupled Document Mode -->
      <div v-if="resolvedEditorType === 'decoupled'" class="ck-decoupled-container ur-editor-decoupled-container">
        <div v-show="toolbar !== 'none'" ref="toolbarContainer" class="ck-decoupled-toolbar ur-editor-decoupled-toolbar"></div>
        <div class="ck-decoupled-editable-wrapper ur-editor-decoupled-editable-wrapper">
          <div ref="editorContainer" class="ck-decoupled-editable ur-editor-decoupled-editable"></div>
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
      @keydown.esc="closeSourceModal"
      @mousedown.self.prevent
    >
      <div 
        class="ur-source-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="ur-source-modal-title"
        @mousedown="handleModalFrameMouseDown"
      >
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
            ✕
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
    // source editing toggle (supported in all modes: classic, inline, balloon, decoupled)
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
    // width: e.g. '100%', '800px', '75vw', or number (px). Default null (100%)
    width: {
      type: [String, Number],
      default: null
    },
    // height: fixed viewport height (e.g. '400px', '50vh', or number in px). Default null (natural auto-expand)
    height: {
      type: [String, Number],
      default: null
    },
    // minHeight: minimum initial height (e.g. '250px', '300px', or number in px). Default null
    minHeight: {
      type: [String, Number],
      default: null
    },
    // preserveStyles: keeps <style>...</style> blocks for email templates & custom styling
    preserveStyles: {
      type: Boolean,
      default: false
    },
    // inlineValue: bind with .sync to receive auto-updated CSS-inlined HTML.
    // Only computed & emitted when this listener is present (zero cost otherwise).
    // Usage: <ckeditor-5 :inline-value.sync="myInlineHtml" />
    // Debounced 500 ms so every keystroke does NOT trigger a full CSS-inline pass.
    inlineValue: {
      type: String,
      default: null
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
      pasteTimeout: null,
      savedStyleBlock: '',
      inlineValueTimer: null  // debounce timer for update:inlineValue emit
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
    resolvedWidth() {
      if (!this.width) return null;
      return typeof this.width === 'number' || !isNaN(this.width) ? `${this.width}px` : this.width;
    },
    resolvedHeight() {
      if (!this.height || this.height === 'auto') return null;
      return typeof this.height === 'number' || !isNaN(this.height) ? `${this.height}px` : this.height;
    },
    resolvedMinHeight() {
      if (!this.minHeight) return null;
      return typeof this.minHeight === 'number' || !isNaN(this.minHeight) ? `${this.minHeight}px` : this.minHeight;
    },
    wrapperStyle() {
      const styles = {};
      if (this.resolvedWidth) styles.width = this.resolvedWidth;
      if (this.resolvedHeight) styles.height = this.resolvedHeight;
      if (this.resolvedMinHeight) {
        styles.minHeight = this.resolvedMinHeight;
        styles['--ur-editor-min-height'] = this.resolvedMinHeight;
      }
      return styles;
    },
    isSourceEditing() {
      return this.isSourceModalOpen;
    }
  },
  watch: {
    value(newVal) {
      if (this.instance && !this.isSettingData && this.mode === 'edit') {
        const currentData = this.getEditorData();
        if (newVal !== currentData && newVal !== this.lastEmittedValue) {
          this.isSettingData = true;
          const cleanVal = this.processIncomingHtml(newVal, true);
          this.instance.setData(cleanVal || '');
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
    },
    preserveStyles(newVal) {
      if (this.mode === 'edit') this.reinitEditor();
      if (!newVal) this.removePreviewStyles();
    },
    savedStyleBlock() {
      this.injectPreviewStyles();
      // Re-emit inline value when style block changes (e.g. after Source Edit save)
      this.scheduleInlineValueUpdate();
    }
  },
  mounted() {
    if (this.mode === 'edit') {
      this.initEditor();
    }
  },
  beforeDestroy() {
    this.removePreviewStyles();
    if (this.inlineValueTimer) {
      clearTimeout(this.inlineValueTimer);
      this.inlineValueTimer = null;
    }
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

      // Nút sourceEditing / enhancedSourceEditing hỗ trợ trên tất cả các kiểu editor (Classic, Inline, Balloon, Decoupled) khi bật prop source
      if (this.source && !items.includes('enhancedSourceEditing') && !items.includes('sourceEditing')) {
        items.push('|', 'enhancedSourceEditing');
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

      // Force-set GHS (GeneralHtmlSupport) to allow ALL elements + class + style attributes.
      // IMPORTANT: defaultConfig in ckeditor.js uses JSON.parse(JSON.stringify(...)) which
      // destroys RegExp values. The {name: /.*/} becomes {name: {}} after serialization,
      // making GHS useless and stripping all div/class attributes. We must override it here.
      if (!baseConfig.htmlSupport) {
        baseConfig.htmlSupport = {
          allow: [{ name: /.*/, attributes: true, classes: true, styles: true }]
        };
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
          const cleanInitData = this.processIncomingHtml(this.value, true);
          editor.setData(cleanInitData || '');
          this.isSettingData = false;
        }

        // Inject saved style block into editor DOM for WYSIWYG preview parity
        this.$nextTick(() => {
          this.injectPreviewStyles();
        });

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

        // Lắng nghe sự kiện mở popup Edit Source từ plugin EnhancedSourceEditing
        editor.on('enhancedSourceEditing:open', () => {
          this.openSourceModal();
        });

        // Data change listener
        editor.model.document.on('change:data', () => {
          if (this.isSettingData || this.isDestroying) return;
          const data = this.getEditorData();
          this.lastEmittedValue = data;
          this.$emit('input', data);
          // Auto-update inlineValue if parent is listening
          this.scheduleInlineValueUpdate();
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
              const data = this.getEditorData();
              this.lastEmittedValue = data;
              this.$emit('input', data);
              this.scheduleInlineValueUpdate();
            }
          }, 100);
        });

        this.$emit('ready', editor);

        // Emit initial inlineValue after data is set
        this.$nextTick(() => {
          this.scheduleInlineValueUpdate(0);
        });
      } catch (err) {
        console.error('[UrEditor] Initialization error:', err);
        this.$emit('error', err);
      }
    },

    processIncomingHtml(html, isExternalOrExplicit = false) {
      if (!html || typeof html !== 'string') {
        if (isExternalOrExplicit || html === '') {
          this.savedStyleBlock = '';
        }
        return '';
      }
      if (!this.preserveStyles || (this.format && this.format.toLowerCase() !== 'html')) {
        return html;
      }

      const styleRegex = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
      const matches = html.match(styleRegex);

      if (matches && matches.length > 0) {
        this.savedStyleBlock = matches.join('\n');
        return html.replace(styleRegex, '').trim();
      } else if (isExternalOrExplicit) {
        this.savedStyleBlock = '';
      }
      return html;
    },

    processOutgoingHtml(html) {
      if (!html && html !== '') return '';
      if (!this.preserveStyles || (this.format && this.format.toLowerCase() !== 'html')) {
        return html;
      }
      if (this.savedStyleBlock) {
        return `${this.savedStyleBlock}\n${html || ''}`.trim();
      }
      return html || '';
    },

    getEditorData() {
      if (!this.instance) return '';
      const rawData = this.instance.getData() || '';
      return this.processOutgoingHtml(rawData);
    },

    getData() {
      return this.getEditorData();
    },

    setData(data) {
      if (!this.instance) return;
      this.isSettingData = true;
      const cleanVal = this.processIncomingHtml(data, true);
      this.instance.setData(cleanVal || '');
      this.lastEmittedValue = this.getEditorData();
      this.$emit('input', this.lastEmittedValue);
      this.$nextTick(() => {
        this.isSettingData = false;
        this.scheduleInlineValueUpdate();
      });
    },

    // ── Inline Value Auto-Sync ────────────────────────────────────────────────
    // Schedules a debounced emit of 'update:inlineValue' so the parent can use
    // :inline-value.sync="myVar" and always have up-to-date CSS-inlined HTML.
    //
    // Key design decisions:
    // 1. LAZY: only runs if parent is listening via $listeners['update:inlineValue']
    //    → zero overhead when the feature is not used
    // 2. DEBOUNCED: waits `delay` ms after last call before running getInlineHtml()
    //    → avoids heavy CSS-inlining work on every keystroke (default 500 ms)
    // 3. ALWAYS EMITS regardless of preserveStyles:
    //    - preserveStyles = true  → emits HTML with CSS rules inlined into style=""
    //    - preserveStyles = false → emits the raw HTML (same as v-model value),
    //      no CSS inlining needed since there are no <style> blocks
    //
    // @param {number} delay  Debounce delay in ms. Pass 0 to fire immediately.
    scheduleInlineValueUpdate(delay = 500) {
      // Early exit: parent not listening → zero cost
      if (!this.$listeners || !this.$listeners['update:inlineValue']) return;

      if (this.inlineValueTimer) {
        clearTimeout(this.inlineValueTimer);
      }

      this.inlineValueTimer = setTimeout(() => {
        this.inlineValueTimer = null;
        if (this.isDestroying) return;
        // getInlineHtml() returns raw HTML when preserveStyles=false (no-op inlining)
        const inlined = this.getInlineHtml();
        this.$emit('update:inlineValue', inlined);
      }, delay);
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
        this.removePreviewStyles();
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
      let content = this.getEditorData() || '';
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
      const cleanContent = this.processIncomingHtml(newContent, true);
      this.instance.setData(cleanContent || '');
      const fullContent = this.getEditorData();
      this.lastEmittedValue = fullContent;
      this.$emit('input', fullContent);
      this.$nextTick(() => {
        this.isSettingData = false;
        this.injectPreviewStyles();
        this.closeSourceModal();
      });
    },

    openSourceEditing() {
      this.openSourceModal();
    },

    handleModalFrameMouseDown(e) {
      // Cho phép tương tác bình thường với các nút bấm hoặc input
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
        return;
      }
      // CHỈ cho phép kéo chọn text khi click chuột bên trong vùng nội dung soạn thảo code (.cm-content)
      if (e.target.closest('.cm-content')) {
        return;
      }
      // Cho phép tương tác với thanh cuộn scrollbar của CodeMirror
      if (e.target.classList && e.target.classList.contains('cm-scroller') && e.offsetX > e.target.clientWidth) {
        return;
      }
      // Chặn mousedown trên header, footer, line numbers (gutters), viền modal để ngăn trình duyệt bắt đầu selection range
      e.preventDefault();
    },

    // ── Preview Style Injection ──────────────────────────────────────────────
    // Inject the savedStyleBlock CSS into the CKEditor DOM container so that
    // the WYSIWYG editable area renders with the email's custom styles,
    // giving visual parity with the Live Preview panel.
    extractCssText(styleBlock) {
      if (!styleBlock) return '';
      const matches = styleBlock.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) || [];
      return matches
        .map(m => m.replace(/<style\b[^>]*>/gi, '').replace(/<\/style>/gi, ''))
        .join('\n');
    },

    injectPreviewStyles() {
      if (!this.preserveStyles || !this.savedStyleBlock || !this.instance) {
        // If conditions not met, ensure any existing injected style is cleaned up
        if (this.instance) this.removePreviewStyles();
        return;
      }

      const styleId = `ur-editor-preview-${this._uid}`;
      let styleEl = document.getElementById(styleId);

      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.setAttribute('data-ur-editor', 'preview-styles');

        // Inject into the CKEditor main element container (NOT inside the
        // contenteditable), so CKEditor won't clear it during rendering.
        // CSS in the document applies to all DOM including contenteditable.
        let container = null;
        try {
          // Try to find the editor's wrapper UI element
          if (this.instance.ui && this.instance.ui.view && this.instance.ui.view.element) {
            container = this.instance.ui.view.element;
          }
        } catch (e) { /* ignore */ }

        (container || document.head).appendChild(styleEl);
      }

      styleEl.textContent = this.extractCssText(this.savedStyleBlock);
    },

    removePreviewStyles() {
      const styleId = `ur-editor-preview-${this._uid}`;
      const styleEl = document.getElementById(styleId);
      if (styleEl) styleEl.remove();
    },

    // ── CSS Inliner ───────────────────────────────────────────────────────────
    // Converts <style> block rules into inline style="" attributes on each element.
    // Perfect for email delivery: Gmail / Outlook strip <style> tags but honour
    // style="" attributes, so inlining ensures the email design is preserved.
    //
    // Usage:
    //   const inlineHtml = this.$refs.editor.getInlineHtml();
    //   // or pass explicit HTML:
    //   const inlineHtml = this.$refs.editor.getInlineHtml(someHtml);
    //
    // Does NOT modify the editor value or savedStyleBlock.
    //
    // @param {string|null} htmlInput  Optional HTML to inline. Defaults to getEditorData().
    // @param {object} [options]
    //   @param {boolean} options.keepStyleTag  Default false. If true, keep <style> tag in output too.
    //   @param {boolean} options.removeClasses  Default false. If true, remove class="" after inlining.
    // @returns {string}  HTML with all CSS rules inlined into style="" attributes.
    getInlineHtml(htmlInput = null, options = {}) {
      const { keepStyleTag = false, removeClasses = false } = options;

      // Source HTML: caller-supplied or current editor output (with <style> block prepended)
      const fullHtml = htmlInput !== null ? String(htmlInput) : this.getEditorData();

      // Extract CSS from htmlInput (if provided) or from savedStyleBlock (when preserveStyles=true)
      let cssText = '';
      if (htmlInput !== null) {
        cssText = this.extractCssText(htmlInput) || (this.preserveStyles ? this.extractCssText(this.savedStyleBlock) : '');
      } else if (this.preserveStyles) {
        cssText = this.extractCssText(this.savedStyleBlock);
      }

      if (!cssText) {
        return fullHtml;
      }

      // ── Step 1: Parse the HTML in a detached document ──────────────────────
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, 'text/html');

      // ── Step 2: Parse CSS rules via a temporary <style> element ───────────
      // We append it to the live document head so the browser parses it as a
      // real CSSStyleSheet (DOMParser does not have a live stylesheet engine).
      const tempStyle = document.createElement('style');
      tempStyle.textContent = cssText;
      document.head.appendChild(tempStyle);

      let sheet = null;
      try {
        sheet = tempStyle.sheet;
      } catch (e) {
        console.warn('[UrEditor] getInlineHtml: Could not parse stylesheet.', e);
      } finally {
        document.head.removeChild(tempStyle);
      }

      if (!sheet || !sheet.cssRules || !sheet.cssRules.length) {
        return fullHtml;
      }

      // ── Step 3: Apply each CSS rule as inline styles ───────────────────────
      // Specificity order: rules are applied in source order (later rules win)
      // so we process them top-to-bottom.  Existing inline styles are preserved
      // and take final precedence (appended last, overriding class-based rules).
      for (const rule of sheet.cssRules) {
        // Only process style rules (type 1); skip @media, @keyframes, etc.
        if (!rule.selectorText || rule.type !== 1) continue;

        // Some pseudo-selectors (:hover, ::before) cannot be inlined — skip
        const selector = rule.selectorText;
        if (/::|:hover|:focus|:active|:visited|:checked|:nth|:first|:last|:not\(|:is\(|:where\(/.test(selector)) {
          continue;
        }

        let elements;
        try {
          elements = doc.querySelectorAll(selector);
        } catch (e) {
          continue; // invalid selector in the target doc — skip
        }

        if (!elements.length) continue;

        // Build a map of property → value from this rule for efficient merging
        const ruleDecls = {};
        for (const prop of rule.style) {
          ruleDecls[prop] = rule.style.getPropertyValue(prop).trim() +
            (rule.style.getPropertyPriority(prop) === 'important' ? ' !important' : '');
        }

        for (const el of elements) {
          // Parse existing inline styles so they can override class-based ones
          const existingInline = {};
          const existingAttr = el.getAttribute('style') || '';
          if (existingAttr) {
            for (const decl of existingAttr.split(';')) {
              const [rawProp, ...rest] = decl.split(':');
              if (rawProp && rest.length) {
                existingInline[rawProp.trim()] = rest.join(':').trim();
              }
            }
          }

          // Merge: class-rule first, existing inline styles override
          const merged = Object.assign({}, ruleDecls, existingInline);
          const mergedStr = Object.entries(merged)
            .map(([p, v]) => `${p}: ${v}`)
            .join('; ');

          el.setAttribute('style', mergedStr);

          if (removeClasses) {
            el.removeAttribute('class');
          }
        }
      }

      // ── Step 4: Optionally remove <style> tags from output ─────────────────
      if (!keepStyleTag) {
        doc.querySelectorAll('style').forEach(s => s.remove());
      }

      // Return body innerHTML (preserves the email content div structure)
      return doc.body.innerHTML;
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

  /* 1. Classic Editor: Tự nhiên co giãn theo nội dung, hoặc khớp theo prop height */
  &.mode-classic,
  &.ur-editor-type-classic {
    .ck-editor__main > .ck-editor__editable:not(.ck-editor__nested-editable) {
      min-height: 200px;
      box-sizing: border-box;
    }

    /* KHI TRUYỀN PROP MIN-HEIGHT (nhưng không cố định height) */
    &.has-custom-min-height:not(.has-custom-height) {
      .ck-editor__main > .ck-editor__editable:not(.ck-editor__nested-editable) {
        min-height: var(--ur-editor-min-height, 200px);
      }
    }

    /* KHI TRUYỀN PROP HEIGHT: Kích hoạt Flexbox để editor vừa khít chiều cao wrapper và cuộn bên trong */
    &.has-custom-height {
      display: flex !important;
      flex-direction: column !important;

      .ck-standard-wrapper {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 0px !important;
        min-height: 0 !important;
        height: 100% !important;
      }

      .ck.ck-editor {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 0px !important;
        min-height: 0 !important;
        height: 100% !important;
      }

      .ck.ck-editor__top {
        flex-shrink: 0 !important;
      }

      .ck.ck-editor__main {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 0px !important;
        min-height: 0 !important;
        height: 100% !important;
        overflow: hidden !important;
      }

      .ck-editor__main > .ck-editor__editable:not(.ck-editor__nested-editable) {
        flex: 1 1 0px !important;
        min-height: 0 !important;
        height: 100% !important;
        overflow-y: auto !important;
        box-sizing: border-box !important;
      }
    }
  }

  /* 2. Decoupled Mode */
  &.mode-decoupled,
  &.ur-editor-type-decoupled {
    /* KHI TRUYỀN PROP HEIGHT: Kích hoạt Flexbox cho Decoupled Editor */
    &.has-custom-height {
      display: flex !important;
      flex-direction: column !important;

      .ck-decoupled-container {
        height: 100% !important;
        min-height: 0 !important;
        flex: 1 1 0px !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }

      .ck-decoupled-toolbar {
        flex-shrink: 0 !important;
      }

      .ck-decoupled-editable-wrapper {
        flex: 1 1 0px !important;
        min-height: 0 !important;
        height: 100% !important;
        overflow-y: auto !important;
      }
    }
  }

  /* 2. Read-only State */
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

  /* 3. View Mode */
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

  /* 4. Source Editing Button (ẩn text label, chỉ giữ icon) */
  .ck.ck-button.ck-source-editing-button .ck-button__label {
    display: none !important;
  }

  /* 5. Table Formatting Cleanup */
  .ck-content .table table td,
  .ck-content .table table th {
    overflow: visible !important;
    scrollbar-width: none !important;
  }

  /* 6. Hide CKEditor 5 Powered-By Logo & Watermarks */
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

  /* 7. Heading Dropdown Disabled State */
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
  z-index: 1000001 !important; /* Luôn nổi trên fullscreen (--ck-z-fullscreen: 10000, --ck-z-dialog: 100000) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  animation: urModalFadeIn 0.15s ease-out;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
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
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

@keyframes urModalScaleIn {
  from { transform: scale(0.96); opacity: 0.8; }
  to { transform: scale(1); opacity: 1; }
}

.ur-source-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.ur-source-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
  user-select: none !important;
  -webkit-user-select: none !important;
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
  user-select: none !important;
  -webkit-user-select: none !important;

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
  user-select: none;
  -webkit-user-select: none;
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

  .cm-scroller {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
    font-size: 13px !important;
    line-height: 1.6 !important;
  }

  /* Tắt chọn text trên gutters, line numbers (số dòng), và fold indicators */
  .cm-gutters,
  .cm-gutter,
  .cm-lineNumbers,
  .cm-gutterElement,
  .cm-foldGutter {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    cursor: default !important;
  }

  /* CHỈ cho phép select text bên trong vùng soạn thảo code */
  .cm-content,
  .cm-line {
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    color: #0f172a !important; /* Độ tương phản cao, chữ không bị mờ */
  }
}

.ur-source-modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
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
  user-select: none !important;
  -webkit-user-select: none !important;

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