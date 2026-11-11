// 点击看板娘（live2d 画布）唤醒「编辑文档」按钮
(function () {
  function ensureButton() {
    if (document.getElementById('edit-entry')) return;
    var btn = document.createElement('a');
    btn.id = 'edit-entry';
    btn.href = '/editor/';
    btn.title = '编辑文档';
    btn.innerHTML = '<i class="fas fa-pen"></i>';
    document.body.appendChild(btn);
  }

  // live2d 画布是 pointer-events:none，收不到点击，
  // 所以用坐标判断：点在画布矩形内就当作点了小猫
  document.addEventListener('click', function (e) {
    var btn = document.getElementById('edit-entry');
    if (!btn) return;
    if (e.target === btn || btn.contains(e.target)) return;

    var canvas = document.getElementById('live2dcanvas');
    if (!canvas) return;
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;

    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      btn.classList.toggle('show');
    }
  }, true);

  function init() {
    ensureButton();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('pjax:complete', init);
  if (document.readyState !== 'loading') init();
})();
