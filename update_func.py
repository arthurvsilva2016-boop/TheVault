with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

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

target = "  return (\n    <div className=\"h-[100dvh] max-h-[100dvh] bg-brand-dark text-slate-200 flex flex-col overflow-hidden\">"

content = content.replace(target, pdf_func + "\n" + target)

with open("src/components/StudentApp.tsx", "w") as f:
    f.write(content)
