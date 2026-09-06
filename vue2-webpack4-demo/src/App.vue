<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo-badge">CK5</div>
        <div>
          <h1 class="app-title">CKEditor 5 &times; Vue 2 &times; Webpack 4</h1>
          <p class="app-subtitle">Multi-Mode, Fullscreen, View/Edit Mode &amp; Custom Config</p>
        </div>
      </div>
      <div class="header-badges">
        <span class="badge badge-primary">CKEditor v48 (Latest)</span>
        <span class="badge badge-success">Vue v2.7</span>
        <span class="badge badge-warning">Webpack v4</span>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="main-layout">
      <!-- Interactive Props Control Panel -->
      <section class="props-panel">
        <div class="panel-section-title">⚙️ Bảng cấu hình Props Component (Live Testing)</div>
        
        <div class="props-rows-container">
          <!-- HÀNG 1: Các thiết lập chính của Editor -->
          <div class="props-row">
            <!-- Prop: mode (edit / view) -->
            <div class="prop-control">
              <label class="prop-label"><code>:mode</code> (Chế độ hoạt động)</label>
              <div class="btn-toggle-group">
                <button 
                  class="toggle-btn" 
                  :class="{ active: currentMode === 'edit' }"
                  @click="setMode('edit')"
                >
                  ✏️ EDIT (Soạn thảo)
                </button>
                <button 
                  class="toggle-btn" 
                  :class="{ active: currentMode === 'view' }"
                  @click="setMode('view')"
                >
                  👁️ VIEW (Chỉ hiển thị)
                </button>
              </div>
            </div>

            <!-- Prop: editor -->
            <div class="prop-control" :class="{ 'is-disabled-prop': currentMode === 'view' }">
              <label class="prop-label"><code>:editor</code> (Kiểu Editor)</label>
              <div class="btn-toggle-group">
                <button 
                  v-for="mode in ['classic', 'inline', 'balloon', 'decoupled']" 
                  :key="mode"
                  class="toggle-btn"
                  :class="{ active: currentEditor === mode }"
                  @click="setEditorMode(mode)"
                >
                  {{ mode.toUpperCase() }}
                </button>
              </div>
            </div>

            <!-- Prop: format -->
            <div class="prop-control">
              <label class="prop-label"><code>:format</code> (Định dạng)</label>
              <div class="btn-toggle-group">
                <button 
                  class="toggle-btn" 
                  :class="{ active: currentFormat === 'html' }"
                  @click="setFormat('html')"
                >
                  HTML
                </button>
                <button 
                  class="toggle-btn" 
                  :class="{ active: currentFormat === 'markdown' }"
                  @click="setFormat('markdown')"
                >
                  MARKDOWN
                </button>
              </div>
            </div>

            <!-- Prop: toolbar -->
            <div class="prop-control" :class="{ 'is-disabled-prop': currentMode === 'view' }">
              <label class="prop-label"><code>:toolbar</code> (Thanh công cụ)</label>
              <div class="btn-toggle-group">
                <button 
                  v-for="tb in ['none', 'normal', 'full']" 
                  :key="tb"
                  class="toggle-btn"
                  :class="{ active: currentToolbar === tb }"
                  @click="currentToolbar = tb"
                >
                  {{ tb.toUpperCase() }}
                </button>
              </div>
            </div>
          </div>

          <!-- HÀNG 2: Kích thước khung & Tính năng nâng cao -->
          <div class="props-row">
            <!-- Prop: height -->
            <div class="prop-control" :class="{ 'is-disabled-prop': currentMode === 'view' }">
              <label class="prop-label"><code>:height</code> (Chiều cao Wrapper)</label>
              <div class="btn-toggle-group">
                <button 
                  class="toggle-btn"
                  :class="{ active: currentHeight === null }"
                  @click="currentHeight = null"
                >
                  Auto (Tự nhiên)
                </button>
                <button 
                  v-for="h in ['350px', '500px']" 
                  :key="h"
                  class="toggle-btn"
                  :class="{ active: currentHeight === h }"
                  @click="currentHeight = h"
                >
                  {{ h }}
                </button>
              </div>
            </div>

            <!-- Prop: width -->
            <div class="prop-control">
              <label class="prop-label"><code>:width</code> (Chiều rộng Wrapper)</label>
              <div class="btn-toggle-group">
                <button 
                  class="toggle-btn"
                  :class="{ active: currentWidth === '100%' }"
                  @click="currentWidth = '100%'"
                >
                  100% (Toàn chiều rộng)
                </button>
                <button 
                  class="toggle-btn"
                  :class="{ active: currentWidth === '850px' }"
                  @click="currentWidth = '850px'"
                >
                  850px (Khung cố định)
                </button>
              </div>
            </div>

            <!-- Prop: readonly -->
            <div class="prop-control prop-switch" :class="{ 'is-disabled-prop': currentMode === 'view' }">
              <label class="prop-label"><code>:readonly</code> (Khóa chỉnh sửa)</label>
              <button 
                class="switch-btn"
                :class="{ 'is-on': isReadOnly }"
                @click="isReadOnly = !isReadOnly"
              >
                {{ isReadOnly ? '🔒 TRUE (Khóa sửa)' : '✏️ FALSE (Cho phép sửa)' }}
              </button>
            </div>

            <!-- Prop: source (Admin mode - Hỗ trợ tất cả kiểu Editor) -->
            <div class="prop-control prop-switch" :class="{ 'is-disabled-prop': currentMode === 'view' }">
              <label class="prop-label"><code>:source</code> (Sửa mã nguồn CodeMirror)</label>
              <button 
                class="switch-btn"
                :class="{ 'is-on': isSourceEnabled }"
                @click="isSourceEnabled = !isSourceEnabled"
              >
                {{ isSourceEnabled ? '🛠️ TRUE (Bật Source Edit)' : '🚫 FALSE (Tắt)' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Action Bar -->
      <div class="toolbar-panel">
        <div class="toolbar-left">
          <div class="dropdown-group">
            <button class="btn btn-outline" @click="loadSample('table')">📊 Mẫu Bảng biểu (Đã sửa scroll)</button>
            <button class="btn btn-outline" @click="loadSample('article')">📄 Mẫu Bài viết</button>
            <button class="btn btn-outline" @click="loadSample('code')">💻 Mẫu Lập trình</button>
          </div>
        </div>

        <div class="toolbar-right">
          <div class="stat-item">
            <span class="stat-label">Số từ:</span>
            <span class="stat-value">{{ wordCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ký tự:</span>
            <span class="stat-value">{{ charCount }}</span>
          </div>
          <button class="btn btn-primary" @click="copyContent">
            <span class="btn-icon">📋</span> Sao chép {{ currentFormat.toUpperCase() }}
          </button>
          <button class="btn btn-ghost" @click="clearContent">
            <span class="btn-icon">🗑️</span> Xóa
          </button>
        </div>
      </div>

      <!-- Editor & Preview Grid -->
      <div class="content-grid">
        <!-- Editor Column -->
        <div class="panel editor-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="dot dot-editor"></span>
              <span v-if="currentMode === 'view'">Khung hiển thị nội dung thuần (Mode: <strong>VIEW</strong> - Không viền/toolbar)</span>
              <span v-else>Trình soạn thảo (Mode: <strong>EDIT</strong> | Kiểu: <strong>{{ currentEditor.toUpperCase() }}</strong>)</span>
            </div>
            <span class="status-indicator status-ready">● Sẵn sàng</span>
          </div>

          <div class="panel-body editor-body-container" :class="{ 'view-mode-container-bg': currentMode === 'view' }">
            <div v-if="currentMode === 'edit' && currentEditor === 'inline'" class="mode-hint">
              💡 <strong>Inline Mode:</strong> Click trực tiếp vào văn bản để hiện toolbar. Toolbar tự động ngắt dòng nếu dài.
            </div>
            <div v-if="currentMode === 'edit' && currentEditor === 'balloon'" class="mode-hint">
              💡 <strong>Balloon Mode:</strong> Bôi đen văn bản để hiện toolbar bong bóng. Toolbar tự động ngắt dòng nếu dài.
            </div>
            <div v-if="currentMode === 'edit' && currentEditor === 'decoupled'" class="mode-hint">
              💡 <strong>Decoupled Mode:</strong> Toolbar và vùng giấy soạn thảo A4 tách rời độc lập.
            </div>
            <div v-if="currentMode === 'view'" class="mode-hint view-hint">
              📄 <strong>View Mode đang bật:</strong> Nội dung hiển thị như một trang web chuẩn không viền, không toolbar, không tương tác editor.
            </div>

            <!-- The Custom Vue Component (UrEditor) with all props -->
            <ckeditor-5
              v-model="content"
              :mode="currentMode"
              :editor="currentEditor"
              :format="currentFormat"
              :readonly="isReadOnly"
              :source="isSourceEnabled"
              :toolbar="currentToolbar"
              :height="currentHeight"
              :width="currentWidth"
              @ready="onReady"
            />
          </div>
        </div>

        <!-- Preview & Code Column -->
        <div class="panel preview-panel">
          <div class="panel-header">
            <div class="tabs">
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'preview' }" 
                @click="activeTab = 'preview'"
              >
                👁️ Xem trước (Live Preview)
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'code' }" 
                @click="activeTab = 'code'"
              >
                &lt;/&gt; Dữ liệu {{ currentFormat.toUpperCase() }}
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'info' }" 
                @click="activeTab = 'info'"
              >
                ℹ️ Props &amp; Hướng dẫn Config
              </button>
            </div>
          </div>

          <div class="panel-body tab-content-body">
            <!-- Tab 1: Live Preview -->
            <div v-show="activeTab === 'preview'" class="live-preview-content ck-content">
              <div v-if="currentFormat === 'html'" v-html="content"></div>
              <div v-else class="markdown-preview-box">
                <pre class="markdown-raw">{{ content }}</pre>
              </div>
            </div>

            <!-- Tab 2: Raw Code -->
            <div v-show="activeTab === 'code'" class="raw-code-container">
              <pre class="raw-code"><code>{{ content }}</code></pre>
            </div>

            <!-- Tab 3: Props & API info -->
            <div v-show="activeTab === 'info'" class="build-info-container">
              <h3>Đặc tả Props của Component &lt;ckeditor-5&gt;</h3>
              <table class="props-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Kiểu dữ liệu</th>
                    <th>Giá trị hỗ trợ</th>
                    <th>Mặc định</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>v-model</code></td>
                    <td>String</td>
                    <td>Chuỗi HTML hoặc Markdown hai chiều</td>
                    <td><code>''</code></td>
                  </tr>
                  <tr>
                    <td><code>mode</code></td>
                    <td>String</td>
                    <td><code>'edit'</code> (soạn thảo), <code>'view'</code> (chỉ hiển thị nội dung web)</td>
                    <td><code>'edit'</code></td>
                  </tr>
                  <tr>
                    <td><code>editor</code></td>
                    <td>String / Object</td>
                    <td><code>'classic'</code>, <code>'inline'</code>, <code>'balloon'</code>, <code>'decoupled'</code></td>
                    <td><code>'classic'</code></td>
                  </tr>
                  <tr>
                    <td><code>format</code></td>
                    <td>String</td>
                    <td><code>'html'</code>, <code>'markdown'</code></td>
                    <td><code>'html'</code></td>
                  </tr>
                  <tr>
                    <td><code>readonly</code></td>
                    <td>Boolean</td>
                    <td><code>true</code> (khóa xem), <code>false</code></td>
                    <td><code>false</code></td>
                  </tr>
                  <tr>
                    <td><code>source</code></td>
                    <td>Boolean</td>
                    <td><code>true</code> (bật nút mở popup Source Edit trên mọi kiểu editor), <code>false</code></td>
                    <td><code>false</code></td>
                  </tr>
                  <tr>
                    <td><code>toolbar</code></td>
                    <td>String</td>
                    <td><code>'none'</code>, <code>'normal'</code>, <code>'full'</code></td>
                    <td><code>'normal'</code></td>
                  </tr>
                  <tr>
                    <td><code>width</code></td>
                    <td>String / Number</td>
                    <td><code>'100%'</code>, <code>'850px'</code>, <code>'80vw'</code>, ...</td>
                    <td><code>null</code> (100%)</td>
                  </tr>
                  <tr>
                    <td><code>height</code></td>
                    <td>String / Number</td>
                    <td><code>'400px'</code>, <code>'60vh'</code>, ... hoặc <code>null</code> (co giãn tự nhiên)</td>
                    <td><code>null</code> (Auto)</td>
                  </tr>
                  <tr>
                    <td><code>minHeight</code></td>
                    <td>String / Number</td>
                    <td><code>'250px'</code>, <code>'300px'</code>, ...</td>
                    <td><code>null</code></td>
                  </tr>
                  <tr>
                    <td><code>config</code></td>
                    <td>Object</td>
                    <td>Ghi đè hoặc mở rộng cấu hình CKEditor</td>
                    <td><code>{}</code></td>
                  </tr>
                </tbody>
              </table>

              <div class="config-guide-box">
                <h4>💡 Hướng dẫn cấu hình Toolbar riêng cho từng Editor qua prop <code>:config</code>:</h4>
                <pre class="code-example"><code>// Cấu hình toolbar riêng cho Inline hoặc Balloon:
const customConfig = {
  toolbar: {
    items: ['bold', 'italic', 'link', '|', 'bulletedList', 'numberedList', 'fullscreen'],
    shouldNotGroupWhenFull: false // Cho phép gộp nút vào menu dropdown nếu hẹp
  }
};

// Sử dụng:
&lt;ckeditor-5 editor="inline" :config="customConfig" /&gt;</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import UrEditor from './components/UrEditor.vue';
import '../../ckeditor5-custom-build/dist/ckeditor.css';

export default {
  name: 'App',
  components: {
    'ckeditor-5': UrEditor,
    UrEditor
  },
  data() {
    return {
      currentMode: 'edit',
      currentEditor: 'classic',
      currentFormat: 'html',
      isReadOnly: false,
      isSourceEnabled: true,
      currentToolbar: 'normal',
      currentHeight: null,
      currentWidth: '100%',
      activeTab: 'preview',
      toastMessage: '',
      toastTimer: null,
      content: `
        <h2>Bảng dữ liệu cấu hình thử nghiệm 📊</h2>
        <p>Bảng bên dưới đã được khắc phục hoàn toàn lỗi thanh cuộn (scroll) ở từng ô:</p>
        <figure class="table">
          <table style="width:100%; border:1px solid #cbd5e1;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th>Chế độ</th>
                <th>Thanh công cụ</th>
                <th>Mục đích</th>
                <th>Fullscreen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Classic</td>
                <td>Cố định</td>
                <td>CMS, Bài viết</td>
                <td>Hỗ trợ nút Fullscreen</td>
              </tr>
              <tr>
                <td>Inline</td>
                <td>Nổi theo focus</td>
                <td>In-place Edit</td>
                <td>Toolbar tự ngắt dòng</td>
              </tr>
              <tr>
                <td>Balloon</td>
                <td>Bong bóng khi bôi đen</td>
                <td>Medium / Notion</td>
                <td>Toolbar tự ngắt dòng</td>
              </tr>
              <tr>
                <td>Decoupled</td>
                <td>Ghim độc lập</td>
                <td>Tài liệu A4</td>
                <td>Toàn màn hình</td>
              </tr>
            </tbody>
          </table>
        </figure>
      `
    };
  },
  computed: {
    wordCount() {
      const text = this.stripHtml(this.content).trim();
      if (!text) return 0;
      return text.split(/\s+/).filter(Boolean).length;
    },
    charCount() {
      const text = this.stripHtml(this.content);
      return text.length;
    }
  },
  methods: {
    stripHtml(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html || '';
      return tmp.textContent || tmp.innerText || '';
    },
    setMode(m) {
      this.currentMode = m;
      this.showToast(`Đã chuyển sang mode: ${m.toUpperCase()}`);
    },
    setEditorMode(mode) {
      this.currentEditor = mode;
      this.showToast(`Đã chuyển sang chế độ: ${mode.toUpperCase()}`);
    },
    setFormat(fmt) {
      this.currentFormat = fmt;
      if (fmt === 'markdown') {
        this.content = `## Tiêu đề Markdown 🌟\n\nĐây là văn bản định dạng **Markdown** thuần túy.\n\n- Danh sách mục 1\n- Danh sách mục 2\n\n> Trích dẫn câu nói hay trong Markdown.\n\n\`\`\`javascript\nconsole.log("Hello Markdown!");\n\`\`\``;
      } else {
        this.content = `<h2>Tiêu đề HTML 🌟</h2><p>Đây là văn bản định dạng <strong>HTML</strong> chuẩn.</p>`;
      }
      this.showToast(`Đã chuyển sang định dạng: ${fmt.toUpperCase()}`);
    },
    onReady() {},
    loadSample(type) {
      if (type === 'article') {
        if (this.currentFormat === 'markdown') {
          this.content = `# Kiến trúc Hệ thống Web Doanh nghiệp\n\n**Vue 2 và Webpack 4** kết hợp với **CKEditor 5** đem lại sự ổn định và hiệu năng cao.\n\n> "Đơn giản hóa tích hợp giúp duy trì mã nguồn sạch và bảo trì dài hạn."`;
        } else {
          this.content = `<h1>Kiến trúc Hệ thống Web Doanh nghiệp</h1><p><strong>Vue 2 và Webpack 4</strong> kết hợp với **CKEditor 5** đem lại sự ổn định và hiệu năng cao.</p><blockquote>"Đơn giản hóa tích hợp giúp duy trì mã nguồn sạch và bảo trì dài hạn."</blockquote>`;
        }
      } else if (type === 'table') {
        this.content = `<h2>Bảng dữ liệu cấu hình</h2><figure class="table"><table style="width:100%; border:1px solid #cbd5e1;"><thead><tr style="background:#f1f5f9;"><th>Chế độ</th><th>Thanh công cụ</th><th>Mục đích</th></tr></thead><tbody><tr><td>Classic</td><td>Cố định</td><td>CMS, Bài viết</td></tr><tr><td>Inline</td><td>Nổi theo focus</td><td>In-place Edit</td></tr><tr><td>Balloon</td><td>Bong bóng khi bôi đen</td><td>Medium / Notion</td></tr><tr><td>Decoupled</td><td>Ghim độc lập</td><td>Tài liệu A4</td></tr></tbody></table></figure>`;
      } else if (type === 'code') {
        this.content = `<h2>Mẫu mã nguồn tích hợp</h2><pre><code class="language-html">&lt;ckeditor-5\n  v-model="content"\n  mode="edit"\n  editor="classic"\n  toolbar="full"\n  height="400px"\n/&gt;</code></pre>`;
      }
      this.showToast('Đã tải nội dung mẫu!');
    },
    clearContent() {
      this.content = '';
      this.showToast('Đã xóa nội dung!');
    },
    copyContent() {
      navigator.clipboard.writeText(this.content).then(() => {
        this.showToast(`Đã sao chép nội dung ${this.currentFormat.toUpperCase()}!`);
      }).catch(() => {
        this.showToast('Không thể sao chép tự động.');
      });
    },
    showToast(msg) {
      this.toastMessage = msg;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastMessage = '';
      }, 3000);
    }
  }
};
</script>

<style>
/* Reset & Base */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0b0f19;
  color: #f1f5f9;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}
.app-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}
.app-subtitle {
  font-size: 13px;
  color: #94a3b8;
}
.header-badges {
  display: flex;
  gap: 8px;
}
.badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}
.badge-primary {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Main Layout */
.main-layout {
  flex: 1;
  padding: 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1750px;
  margin: 0 auto;
  width: 100%;
}

/* Interactive Props Panel */
.props-panel {
  background: #131c2e;
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.panel-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #60a5fa;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.props-rows-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.props-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 20px;
  align-items: stretch;
}

.prop-control {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.prop-control.is-disabled-prop {
  opacity: 0.45;
  pointer-events: none;
}

.prop-label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prop-label code {
  color: #38bdf8;
  font-weight: 600;
}

.btn-toggle-group {
  display: flex;
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  padding: 3px;
  height: 38px;
  min-height: 38px;
  box-sizing: border-box;
}

.toggle-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.toggle-btn.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

.switch-btn {
  background: #0b0f19;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  height: 38px;
  min-height: 38px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.switch-btn.is-on {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border-color: #10b981;
}

@media (max-width: 1250px) {
  .props-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .props-row {
    grid-template-columns: 1fr;
  }
}

/* Toolbar Panel */
.toolbar-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: #131c2e;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dropdown-group {
  display: flex;
  gap: 8px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.btn-primary {
  background: #2563eb;
  color: #ffffff;
}
.btn-primary:hover {
  background: #1d4ed8;
}
.btn-outline {
  background: transparent;
  color: #cbd5e1;
  border-color: #334155;
}
.btn-outline:hover {
  background: #1e293b;
  color: #ffffff;
}
.btn-ghost {
  background: transparent;
  color: #94a3b8;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #0b0f19;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #1e293b;
  font-size: 13px;
}
.stat-label {
  color: #94a3b8;
}
.stat-value {
  font-weight: 700;
  color: #38bdf8;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  flex: 1;
}
@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* Panels */
.panel {
  background: #131c2e;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: 12px 18px;
  background: #182235;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #e2e8f0;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-editor {
  background: #3b82f6;
  box-shadow: 0 0 8px #3b82f6;
}
.status-indicator {
  font-size: 12px;
}
.status-ready {
  color: #34d399;
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.editor-body-container {
  background: #ffffff;
  color: #1e293b;
  border-radius: 0 0 12px 12px;
}
.editor-body-container.view-mode-container-bg {
  background: #ffffff;
  padding: 24px;
}
.mode-hint {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 8px 12px;
  font-size: 13px;
  color: #1e40af;
  margin-bottom: 12px;
  border-radius: 0 4px 4px 0;
}
.mode-hint.view-hint {
  background: #f0fdf4;
  border-left-color: #10b981;
  color: #166534;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 6px;
}
.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}
.tab-btn.active {
  background: #2563eb;
  color: #ffffff;
}

/* Tab Content */
.tab-content-body {
  background: #0e1524;
}
.live-preview-content {
  background: #ffffff;
  color: #1e293b;
  border-radius: 8px;
  padding: 20px;
  min-height: 100%;
}
.raw-code-container {
  background: #0b0f19;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #1e293b;
  height: 100%;
}
.raw-code, .markdown-raw {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #38bdf8;
  white-space: pre-wrap;
  word-break: break-all;
}
.build-info-container {
  background: #131c2e;
  border-radius: 8px;
  padding: 16px;
  color: #cbd5e1;
}
.build-info-container h3 {
  color: #ffffff;
  margin-bottom: 12px;
  font-size: 15px;
}
.props-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.props-table th, .props-table td {
  padding: 8px 10px;
  border: 1px solid #334155;
  text-align: left;
}
.props-table th {
  background: #1e293b;
  color: #94a3b8;
}
.props-table code {
  background: #0b0f19;
  color: #34d399;
  padding: 2px 4px;
  border-radius: 4px;
}

.config-guide-box {
  margin-top: 18px;
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 14px;
}
.config-guide-box h4 {
  color: #60a5fa;
  font-size: 13px;
  margin-bottom: 8px;
}
.code-example code {
  color: #f1f5f9;
  font-size: 12px;
  line-height: 1.5;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #1e293b;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #3b82f6;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
}
</style>
