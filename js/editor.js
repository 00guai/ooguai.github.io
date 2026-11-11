(function () {
  var TOKEN_KEY = 'editor_token';
  var state = {
    token: sessionStorage.getItem(TOKEN_KEY) || '',
    file: ''
  };

  function $(id) { return document.getElementById(id); }

  var TEMPLATE = [
    '<div id="ed-gate" class="ed-card">',
    '  <h2>🔐 写作后台</h2>',
    '  <p>输入密码进入编辑模式</p>',
    '  <input id="ed-password" type="password" placeholder="请输入密码" autocomplete="off">',
    '  <button id="ed-login-btn" class="ed-btn">进入</button>',
    '  <p id="ed-error" class="ed-error"></p>',
    '</div>',
    '<div id="ed-panel" class="ed-card" style="display:none">',
    '  <div class="ed-toolbar">',
    '    <button data-md="h1" class="ed-btn">H1</button>',
    '    <button data-md="h2" class="ed-btn">H2</button>',
    '    <button data-md="bold" class="ed-btn">粗体</button>',
    '    <button data-md="link" class="ed-btn">链接</button>',
    '    <button data-md="quote" class="ed-btn">引用</button>',
    '    <button data-md="list" class="ed-btn">列表</button>',
    '    <button data-md="code" class="ed-btn">代码</button>',
    '  </div>',
    '  <input id="ed-title" class="ed-input" placeholder="文章标题">',
    '  <textarea id="ed-content" class="ed-textarea" placeholder="在这里写正文，支持 Markdown"></textarea>',
    '  <div class="ed-actions">',
    '    <button id="ed-save" class="ed-btn ed-primary">保存并发布</button>',
    '    <button id="ed-new" class="ed-btn">新建</button>',
    '    <select id="ed-list" class="ed-select"></select>',
    '    <span id="ed-status"></span>',
    '  </div>',
    '</div>'
  ].join('\n');

  function ensureCss() {
    if (document.querySelector('link[href="/css/editor.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/editor.css';
    document.head.appendChild(link);
  }

  function setStatus(msg, isError) {
    var s = $('ed-status');
    if (!s) return;
    s.textContent = msg || '';
    s.style.color = isError ? '#e63946' : '#49b1f5';
  }

  function api(url, options) {
    options = options || {};
    if (options.body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(options.body);
    }
    return fetch(url, options).then(function (r) { return r.json(); });
  }

  function showPanel() {
    $('ed-gate').style.display = 'none';
    $('ed-panel').style.display = 'block';
    loadPosts();
  }

  function login() {
    var pwd = $('ed-password').value;
    if (!pwd) { $('ed-error').textContent = '请输入密码'; return; }
    api('/editor-api/login', { method: 'POST', body: { password: pwd } }).then(function (res) {
      if (res.ok) {
        state.token = res.token;
        sessionStorage.setItem(TOKEN_KEY, res.token);
        $('ed-error').textContent = '';
        showPanel();
      } else {
        $('ed-error').textContent = res.msg || '登录失败';
      }
    }).catch(function () {
      $('ed-error').textContent = '接口不可用：请用 hexo server 运行（不要用静态服务器）';
    });
  }

  function loadPosts() {
    api('/editor-api/posts').then(function (res) {
      var sel = $('ed-list');
      sel.innerHTML = '<option value="">＋ 新建文章</option>';
      (res.posts || []).forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.file;
        o.textContent = p.title;
        sel.appendChild(o);
      });
    });
  }

  function resetForm() {
    state.file = '';
    $('ed-title').value = '';
    $('ed-content').value = '';
    setStatus('');
  }

  function openPost(file) {
    if (!file) { resetForm(); return; }
    api('/editor-api/post?file=' + encodeURIComponent(file)).then(function (res) {
      if (!res.ok) { setStatus(res.msg || '读取失败', true); return; }
      state.file = res.file;
      $('ed-title').value = res.title || '';
      $('ed-content').value = res.content || '';
      setStatus('已载入：' + res.file);
    });
  }

  function insertMd(kind) {
    var ta = $('ed-content');
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    var sel = ta.value.slice(start, end);
    var before = ta.value.slice(0, start);
    var after = ta.value.slice(end);
    var text = '';

    if (kind === 'h1') text = '# ' + (sel || '标题');
    else if (kind === 'h2') text = '## ' + (sel || '小标题');
    else if (kind === 'bold') text = '**' + (sel || '粗体') + '**';
    else if (kind === 'link') text = '[' + (sel || '链接文字') + '](https://example.com)';
    else if (kind === 'quote') text = '> ' + (sel || '引用内容');
    else if (kind === 'list') text = '- ' + (sel || '列表项');
    else if (kind === 'code') text = '```\n' + (sel || 'code') + '\n```';

    ta.value = before + text + after;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = start + text.length;
  }

  function poll(url, tries) {
    return fetch(url).then(function (r) {
      if (r.ok) return true;
      if (tries <= 0) return false;
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(poll(url, tries - 1)); }, 500);
      });
    }).catch(function () {
      if (tries <= 0) return false;
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(poll(url, tries - 1)); }, 500);
      });
    });
  }

  function save() {
    var title = $('ed-title').value.trim();
    var content = $('ed-content').value;
    if (!title) { setStatus('标题不能为空', true); return; }

    setStatus('正在保存…');
    api('/editor-api/save', {
      method: 'POST',
      body: { token: state.token, file: state.file, title: title, content: content }
    }).then(function (res) {
      if (!res.ok) { setStatus(res.msg || '保存失败', true); return; }
      state.file = res.file;
      setStatus('已保存，正在生成页面…');
      return poll(res.url, 20).then(function (ok) {
        if (ok) {
          setStatus('生成完成，正在跳转…');
          window.location.href = res.url;
        } else {
          setStatus('已保存，但页面没生成好，稍后手动打开：' + res.url, true);
        }
      });
    });
  }

  function bind() {
    $('ed-login-btn').addEventListener('click', login);
    $('ed-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') login();
    });
    $('ed-save').addEventListener('click', save);
    $('ed-new').addEventListener('click', function () {
      $('ed-list').value = '';
      resetForm();
    });
    $('ed-list').addEventListener('change', function (e) {
      openPost(e.target.value);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-md]'), function (btn) {
      btn.addEventListener('click', function () { insertMd(btn.getAttribute('data-md')); });
    });
  }

  function build() {
    var root = document.getElementById('editor-root');
    if (!root || root.dataset.ready === '1') return;
    root.dataset.ready = '1';
    root.innerHTML = TEMPLATE;
    ensureCss();
    bind();
    if (state.token) showPanel();
  }

  document.addEventListener('DOMContentLoaded', build);
  document.addEventListener('pjax:complete', build);
  if (document.readyState !== 'loading') build();
})();
