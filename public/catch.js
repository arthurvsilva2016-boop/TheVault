window.addEventListener('error', function(e) {
  document.body.innerHTML += '<div style="color:red;z-index:9999;position:fixed;top:0;left:0;background:white;padding:20px;">' + e.message + '<br>' + e.filename + ':' + e.lineno + '</div>';
});
