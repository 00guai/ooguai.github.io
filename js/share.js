// 分享本页链接（复制标题 + 链接到剪贴板）
function share_() {
  var url = window.location.origin + window.location.pathname
  var title = document.title
  var bar = title.lastIndexOf('|')
  if (bar > -1) title = title.slice(0, bar).trim()
  var text = '零零怪 的站内分享\n标题：' + title + '\n链接：' + url + '\n欢迎来访！'

  function done() {
    try {
      if (window.btf && typeof btf.snackbarShow === 'function' && window.GLOBAL_CONFIG && GLOBAL_CONFIG.Snackbar) {
        btf.snackbarShow('本页链接已复制，快去分享吧~', false, 3000)
        return
      }
    } catch (e) {}
    alert('链接已复制：\n' + url)
  }

  function fallback() {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;left:-9999px;top:0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch (e) { console.error('复制失败', e) }
    document.body.removeChild(ta)
    done()
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback)
  } else {
    fallback()
  }
}

// 防抖
var shareTimer = null
function share() {
  clearTimeout(shareTimer)
  shareTimer = setTimeout(share_, 300)
}
