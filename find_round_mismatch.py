with open("/Users/annamalaiyar/Desktop/ControlRoom/src/components/PurchaseOrdersView.jsx", 'r', encoding='utf-8') as f:
    code = f.read()

round_br = 0
in_string = None
in_comment = False
in_multiline_comment = False
escape = False

for idx, char in enumerate(code):
    if escape:
        escape = False
        continue
    
    if in_comment:
        if char == '\n':
            in_comment = False
        continue
        
    if in_multiline_comment:
        if char == '/' and code[idx-1] == '*':
            in_multiline_comment = False
        continue
        
    if in_string:
        if char == '\\':
            escape = True
        elif char == in_string:
            in_string = None
        continue
        
    # Check for comments/strings start
    if char == '"' or char == "'" or char == '`':
        in_string = char
    elif char == '/' and idx + 1 < len(code) and code[idx+1] == '/':
        in_comment = True
    elif char == '/' and idx + 1 < len(code) and code[idx+1] == '*':
        in_multiline_comment = True
    elif char == '(':
        round_br += 1
    elif char == ')':
        round_br -= 1
        if round_br < 0:
            print(f"Unmatched ')' at char {idx}, around line {code[:idx].count(chr(10)) + 1}")

print("Round bracket balance:", round_br)
