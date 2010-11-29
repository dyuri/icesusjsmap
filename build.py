#!/usr/bin/env python

OUT_INDEX = 'index.html'
OUT_JSMAP = 'jsmap.html'
IN_HTML = 'template.html'
IN_JS = 'icemap.js'
IN_CSS = 'icemap.css'

out_index = open(OUT_INDEX, 'w')
out_jsmap = open(OUT_JSMAP, 'w')
in_html = open(IN_HTML, 'r')
in_js = open(IN_JS, 'r')
in_css = open(IN_CSS, 'r')

html_content = in_html.read()

html_content_index = html_content % {
    'css': '<link rel="stylesheet" href="%s" />' % IN_CSS,
    'js': '<script src="%s"></script>' % IN_JS,
}

html_content_jsmap = html_content % {
    'css': '<style type="text/css">\n%s\n</style>\n' % in_css.read(),
    'js': '<script>\n%s\n</script>\n' % in_js.read(),
}

out_jsmap.write(html_content_jsmap)
out_index.write(html_content_index)
