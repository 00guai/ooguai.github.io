// 导航栏滚动显示标题（不依赖 jQuery）
(function () {
  var lastY = 0

  function pageName() {
    var title = document.title
    var i = title.lastIndexOf('|')
    return (i > -1 ? title.slice(0, i) : title).trim()
  }

  function titleEl() {
    return document.getElementById('name-container')
  }

  function menuEl() {
    return document.querySelector('#menus .menus_items')
  }

  function hideTitle() {
    var t = titleEl()
    var m = menuEl()
    if (t) t.style.display = 'none'
    if (m) m.style.display = ''
  }

  function showTitle() {
    var t = titleEl()
    var m = menuEl()
    var name = document.getElementById('page-name')
    if (name) name.textContent = pageName()
    if (t) t.style.display = 'block'
    if (m) m.style.display = 'none'
  }

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0
    if (y > lastY && y > 100) showTitle()
    else if (y < lastY) hideTitle()
    lastY = y
  }

  function init() {
    lastY = window.pageYOffset || 0
    hideTitle()
    window.removeEventListener('scroll', onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  window.scrollToTop = function () {
    hideTitle()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:complete', init)
})()
