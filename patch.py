import re

with open('public/AUDIT_REPORT.md', 'r') as f:
    content = f.read()

# Replace the specific placeholder using regex just in case
content = re.sub(r"> \*Report Generated on: \$\(date \+'%Y-%m-%d %H:%M:%S'\)\*", "> *Report Generated on: [CURRENT_TIMESTAMP]*", content)

with open('public/AUDIT_REPORT.md', 'w') as f:
    f.write(content)
