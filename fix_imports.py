with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

if "import jsPDF" not in content:
    content = content.replace("import React,", "import jsPDF from 'jspdf';\nimport html2canvas from 'html2canvas';\nimport React,")

with open("src/components/StudentApp.tsx", "w") as f:
    f.write(content)
