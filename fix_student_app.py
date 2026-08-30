with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

# Fix groupSessions -> mySessions
content = content.replace("groupSessions.length", "mySessions.length")
content = content.replace("groupSessions.map", "mySessions.map")

# Fix setPreviewWhiteboardFile -> setSelectedImagePreview
content = content.replace("setPreviewWhiteboardFile(wb)", "setSelectedImagePreview(wb.imageDataUrl)")

# Fix missing CalendarDays - add to import
if "CalendarDays" not in content[:1000]:
    content = content.replace("import { \n  Sparkles,", "import { \n  Sparkles,\n  CalendarDays,")

# Remove duplicate Download
content = content.replace("FileText, FolderOpen, Download, Eye,", "FileText, FolderOpen, Eye,")

with open("src/components/StudentApp.tsx", "w") as f:
    f.write(content)
