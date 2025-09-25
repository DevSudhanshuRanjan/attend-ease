import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export attendance data to PDF
 * @param {Object} attendanceData - Attendance data to export
 * @param {Object} user - User information
 */
export const exportToPDF = (attendanceData, user) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 20;

    // Add header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text('AttendEase', margin, yPosition);
    doc.text('- UPES Attendance Report', margin + 45, yPosition);

    // Add underline
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5);

    yPosition += 25;

    // Add student information
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const studentInfo = [
      ['Student Name:', attendanceData.student?.name || 'N/A'],
      ['Student ID:', attendanceData.student?.studentId || user?.userId || 'N/A'],
      ['Course:', attendanceData.student?.course || 'N/A'],
      ['Report Generated:', new Date().toLocaleDateString()],
      ['Data Fetched:', new Date(attendanceData.timestamp).toLocaleString()]
    ];

    studentInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 40, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Add summary section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Attendance Summary', margin, yPosition);
    yPosition += 15;

    // Summary table
    const summaryData = [
      ['Total Subjects', attendanceData.summary?.totalSubjects || 0],
      ['Safe Subjects (≥75%)', attendanceData.summary?.safeSubjects || 0],
      ['Warning Subjects (65-74%)', attendanceData.summary?.warningSubjects || 0],
      ['Critical Subjects (<65%)', attendanceData.summary?.criticalSubjects || 0],
      ['Overall Percentage', `${attendanceData.summary?.overallPercentage || 0}%`]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Add detailed attendance table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Detailed Attendance Report', margin, yPosition);
    yPosition += 10;

    // Prepare table data
    const headers = [
      ['S.No', 'Subject', 'Attended', 'Total', 'Percentage', 'Status', 'Action Needed']
    ];

    const tableData = attendanceData.attendance?.map((subject, index) => {
      const classesNeeded = calculateClassesToAttend(subject);
      const actionNeeded = classesNeeded > 0 
        ? `Attend next ${classesNeeded} class${classesNeeded > 1 ? 'es' : ''}`
        : 'Keep up the good work';

      return [
        `${index + 1}`,
        subject.subject || 'N/A',
        `${subject.attendedClasses || 0}`,
        `${subject.totalClasses || 0}`,
        `${(subject.percentage || 0).toFixed(1)}%`,
        subject.status || 'Unknown',
        actionNeeded
      ];
    }) || [];

    doc.autoTable({
      startY: yPosition + 5,
      head: headers,
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 15 }, // S.No
        1: { cellWidth: 50 }, // Subject
        2: { cellWidth: 20 }, // Attended
        3: { cellWidth: 20 }, // Total
        4: { cellWidth: 25 }, // Percentage
        5: { cellWidth: 20 }, // Status
        6: { cellWidth: 40 }  // Action Needed
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        // Color code based on status
        if (data.column.index === 5 && data.cell.section === 'body') {
          const status = data.cell.text[0]?.toLowerCase();
          if (status === 'critical') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'warning') {
            data.cell.styles.textColor = [245, 158, 11]; // Yellow
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'safe') {
            data.cell.styles.textColor = [16, 185, 129]; // Green
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Color code percentages
        if (data.column.index === 4 && data.cell.section === 'body') {
          const percentage = parseFloat(data.cell.text[0]);
          if (percentage >= 75) {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          } else if (percentage >= 65) {
            data.cell.styles.textColor = [245, 158, 11]; // Yellow
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Add footer with recommendations
    const finalY = doc.lastAutoTable.finalY + 20;
    
    // Add recommendations section if space allows
    if (finalY < doc.internal.pageSize.height - 60) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Recommendations:', margin, finalY);
      
      let recommendationY = finalY + 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const recommendations = generateRecommendations(attendanceData);
      recommendations.forEach((recommendation, index) => {
        if (recommendationY < doc.internal.pageSize.height - 20) {
          doc.text(`${index + 1}. ${recommendation}`, margin, recommendationY);
          recommendationY += 6;
        }
      });
    }

    // Add footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by AttendEase - UPES Attendance Tracker', margin, footerY);
    doc.text(`Report generated on ${new Date().toLocaleString()}`, pageWidth - margin - 80, footerY);

    // Add disclaimer
    doc.text('Disclaimer: Always verify attendance with official UPES sources.', margin, footerY + 8);

    // Save the PDF
    const fileName = `AttendEase_Report_${user?.userId || 'Student'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to generate PDF report. Please try again.');
  }
};

/**
 * Calculate classes needed to reach target percentage
 * @param {Object} subject - Subject data
 * @param {number} targetPercentage - Target percentage (default: 75)
 * @returns {number} Number of classes to attend
 */
const calculateClassesToAttend = (subject, targetPercentage = 75) => {
  const currentAttended = parseInt(subject.attendedClasses) || 0;
  const currentTotal = parseInt(subject.totalClasses) || 0;
  const currentPercentage = parseFloat(subject.percentage) || 0;

  if (currentPercentage >= targetPercentage) {
    return 0;
  }

  const classesNeeded = Math.ceil(
    (targetPercentage * currentTotal - currentAttended * 100) / (100 - targetPercentage)
  );

  return Math.max(0, classesNeeded);
};

/**
 * Generate recommendations based on attendance data
 * @param {Object} attendanceData - Attendance data
 * @returns {Array} Array of recommendation strings
 */
const generateRecommendations = (attendanceData) => {
  const recommendations = [];
  const { summary, attendance } = attendanceData;

  if (summary?.criticalSubjects > 0) {
    recommendations.push(`Immediate action required for ${summary.criticalSubjects} subject(s) with critical attendance. Contact faculty members immediately.`);
  }

  if (summary?.warningSubjects > 0) {
    recommendations.push(`Focus on ${summary.warningSubjects} subject(s) in warning zone. Attend all upcoming classes to improve attendance.`);
  }

  if (summary?.overallPercentage < 75) {
    recommendations.push('Overall attendance is below 75%. Prioritize attending classes for subjects with lowest attendance.');
  }

  if (summary?.safeSubjects === summary?.totalSubjects && summary?.totalSubjects > 0) {
    recommendations.push('Excellent work! All subjects have safe attendance. Continue maintaining regular attendance.');
  }

  // Add specific subject recommendations
  const criticalSubjects = attendance?.filter(s => s.status?.toLowerCase() === 'critical') || [];
  if (criticalSubjects.length > 0) {
    const subjectNames = criticalSubjects.slice(0, 3).map(s => s.subject).join(', ');
    recommendations.push(`Priority subjects requiring immediate attention: ${subjectNames}${criticalSubjects.length > 3 ? ', and others' : ''}.`);
  }

  recommendations.push('Check your attendance weekly to stay on top of your academic progress.');
  recommendations.push('Maintain attendance above 80% to have a buffer for emergencies.');

  return recommendations;
};