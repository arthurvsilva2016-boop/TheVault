with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

import re

# Add imports
if "import jsPDF" not in content:
    content = content.replace("import React,", "import jsPDF from 'jspdf';\nimport html2canvas from 'html2canvas';\nimport React,")

# Add handleDownloadGradesPDF
pdf_func = """
  const handleDownloadGradesPDF = async () => {
    const element = document.getElementById('grades-summary-container');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' }); // brand-dark bg
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student.name.replace(/\s+/g, '_')}_Grades_Summary.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF');
    }
  };
"""

# Insert function before the return statement of StudentApp (which starts with return (\n    <div className="min-h-screen bg-brand-dark)
# Find a good place, maybe right before the return
if "handleDownloadGradesPDF" not in content:
    content = content.replace("  return (\n    <div className=\"min-h-screen", pdf_func + "\n  return (\n    <div className=\"min-h-screen")

# Update the grades tab header and container
target_grades = """            {activeTab === 'grades' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                    Academic Grades & Evaluation
                  </h1>
                </div>"""

replacement_grades = """            {activeTab === 'grades' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                    Academic Grades & Evaluation
                  </h1>
                  <button 
                    onClick={handleDownloadGradesPDF}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-lg text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Share PDF
                  </button>
                </div>
                <div id="grades-summary-container" className="space-y-3 p-4 bg-brand-dark -mx-4 sm:mx-0 sm:rounded-xl">
                  <div className="mb-4 text-center pb-4 border-b border-brand-border/50">
                    <h2 className="text-lg font-bold text-slate-100">{student.name}</h2>
                    <p className="text-xs text-slate-400">Academic Performance Summary</p>
                  </div>"""

# I need to match the actual file content, let's just make sure we replace the container part as well.
# We also need to close the extra div for grades-summary-container.
# Wait, replacing the whole block is better:
