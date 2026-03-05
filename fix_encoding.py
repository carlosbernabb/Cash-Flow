import codecs, sys

for f in ['app.js', 'db.js', 'admin.js']:
    path = rf'c:\Users\carbe\OneDrive\Escritorio\Cash_Flow\js\{f}'
    try:
        with open(path, 'rb') as file:
            raw = file.read()
        if raw.startswith(codecs.BOM_UTF16_LE):
            text = raw.decode('utf-16le')
        elif b'\x00' in raw:
            text = raw.decode('utf-16le')
        else:
            text = raw.decode('utf-8')
        
        with open(path, 'w', encoding='utf-8') as file:
            file.write(text)
        print(f"Fixed {f}")
    except Exception as e:
        print(f"Error {f}: {e}")
