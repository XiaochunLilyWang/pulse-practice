from pathlib import Path
import re, zipfile, json, subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'xhs-dist'
OUT.mkdir(exist_ok=True)
(ROOT/'releases').mkdir(exist_ok=True)
html=(ROOT/'index.html').read_text()
js=re.search(r'<script>([\s\S]*?)</script>',html).group(1)
css=re.search(r'<style>([\s\S]*?)</style>',html).group(1)
html=re.sub(r'<script>[\s\S]*?</script>','<script src="./app.js"></script>',html)
html=re.sub(r'<style>[\s\S]*?</style>','<link rel="stylesheet" href="./style.css">',html)
# ES2017 syntax and native array APIs supported by Chrome 61.
js=js.replace('catch{','catch(error){')
js=js.replace('customSteps().flatMap((on,i)=>on?[i/config.customDivision]:[])','customSteps().reduce((offsets,on,i)=>{if(on)offsets.push(i/config.customDivision);return offsets},[])')
js=js.replace('}))).flat()', '}))).reduce((all,bar)=>all.concat(bar),[])')
# Convert externally assigned event callbacks to addEventListener without changing callback bodies.
pattern=re.compile(r"(\$\([^)]*\))\.on(click|input|change|blur)=")
while True:
    match=pattern.search(js)
    if not match: break
    pos=match.end(); end=pos; stack=[]; quote=None; escape=False
    while end<len(js):
        c=js[end]
        if quote:
            if escape: escape=False
            elif c=='\\': escape=True
            elif c==quote: quote=None
        elif c in "'\"`": quote=c
        elif c in '([{': stack.append(c)
        elif c in ')]}':
            if not stack: break
            stack.pop()
        elif c==';' and not stack: break
        end+=1
    expression=js[pos:end]
    js=js[:match.start()]+match[1]+'.addEventListener('+repr(match[2])+','+expression+')'+js[end:]
# Audio is optional: failures must not prevent visual practice from starting.
js=js.replace("if(A)audio=new A()", "if(A)try{audio=new A()}catch(error){audio=null}")
js=js.replace("if(audio)try{await audio.resume()}catch(error){}", "if(audio)try{await audio.resume()}catch(error){audio=null}if(!audio){$('audioStatus').hidden=false;$('audioStatus').textContent='当前环境不支持声音，可继续跟随画面练习。'}")
js=js.replace("$('beatGrid').setPointerCapture(e.pointerId)","if($('beatGrid').setPointerCapture)$('beatGrid').setPointerCapture(e.pointerId)")
# Chrome 61 lacks 8-digit hex colours, modern inset shorthand, and flex gap.
def rgba(m):
    v=m.group(1)
    return 'rgba(%d,%d,%d,%.4f)'%(int(v[:2],16),int(v[2:4],16),int(v[4:6],16),int(v[6:],16)/255)
css=re.sub(r'#([0-9a-fA-F]{8})(?![0-9a-fA-F])',rgba,css)
js=re.sub(r'#([0-9a-fA-F]{8})(?![0-9a-fA-F])',rgba,js)
css=css.replace('inset:0','top:0;right:0;bottom:0;left:0')
css=css.replace('gap:','grid-gap:')
css=re.sub(r'([^{}]+)\{([^{}]+)\}',lambda m:m[1]+'{'+(re.sub(r'grid-gap:[^;{}]+;?', '', m[2]) if 'display:flex' in m[2] else m[2])+'}',css)
css=css.replace('button:focus-visible,input:focus-visible','button:focus,input:focus')
css=css.replace('user-select:none','-webkit-user-select:none;user-select:none')
css=re.sub(r'(?<![-])appearance:textfield','-webkit-appearance:textfield;appearance:textfield',css)
css=css.replace('padding-top:max(16px,env(safe-area-inset-top));','padding-top:16px;')
css+='''
/* Local compatibility fallbacks and container-provided safe areas. */
html,body{min-height:100%;}html{touch-action:manipulation}body{-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.settings,.preview,.control-value,.editor-top{min-width:0}
.measures>*+*{margin-left:5px}.editor-actions>*+*{margin-left:8px}.preview-foot>*+*{margin-left:10px}.editor-top>*+*{margin-left:8px}
.app{--edge-top:32px;padding-top:calc(var(--edge-top) + var(--safe-area-inset-top,0px));padding-bottom:calc(32px + var(--safe-area-inset-bottom,0px))}
.gamebar{padding-top:calc(16px + var(--safe-area-inset-top,0px))}
.game{padding-bottom:0;padding-bottom:var(--safe-area-inset-bottom,0px)}
@supports(padding:env(safe-area-inset-top)){
.app{padding-top:calc(var(--edge-top) + var(--safe-area-inset-top,env(safe-area-inset-top,0px)));padding-bottom:calc(32px + var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))}
.gamebar{padding-top:calc(16px + var(--safe-area-inset-top,env(safe-area-inset-top,0px)))}
.game{padding-bottom:var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))}}
@media(max-width:720px){.app{--edge-top:22px}}
'''
html=html.replace('<div class="progress">','<p id="audioStatus" class="hint" hidden></p><div class="progress">')
(OUT/'index.html').write_text(html)
(OUT/'app.js').write_text(js)
(OUT/'style.css').write_text(css)
zip_path=ROOT/'releases'/'pulse-practice-xhs-tool.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for name in ['index.html','app.js','style.css']:
        archive.write(OUT/name,name)
print(json.dumps({'directory':str(OUT),'zip':str(zip_path),'zip_bytes':zip_path.stat().st_size,'files':[{ 'name':p.name,'bytes':p.stat().st_size} for p in OUT.iterdir()]},ensure_ascii=False,indent=2))
