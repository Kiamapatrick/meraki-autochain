import re

# Fix shared-passport.js
path1 = r'C:\Users\ADMIN\Downloads\github\meraki-autochain\meraki-autochain\meraki-user-portal\js\user\shared-passport.js'
with open(path1, 'r', encoding='utf-8') as f:
    content = f.read()

new_esc = """function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
}"""

content = re.sub(r'function esc\(str\) \{[\s\S]*?\}', new_esc, content)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix verify.js
path2 = r'C:\Users\ADMIN\Downloads\github\meraki-autochain\meraki-autochain\meraki-user-portal\js\user\verify.js'
with open(path2, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'function esc\(str\) \{[\s\S]*?\}', new_esc, content)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done fixing both files')