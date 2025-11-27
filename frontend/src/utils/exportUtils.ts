/**
 * Utility functions for exporting data to CSV/Excel/PDF formats
 */

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
}

export interface ReportData {
  title: string
  type: 'summary' | 'children' | 'photos' | 'risk'
  dateFrom?: string
  dateTo?: string
  stats?: {
    totalChildren: number
    totalPhotos: number
    analyzedPhotos: number
    highRisk: number
    mediumRisk: number
    lowRisk: number
  }
  children?: any[]
  photos?: any[]
  riskData?: any[]
}

/**
 * Get logo as base64 or path
 */
const getLogoBase64 = (): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        resolve('')
      }
    }
    img.onerror = () => resolve('')
    img.src = '/logo.png'
  })
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: ExportData, filename: string) => {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => 
      row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Export report as PDF (HTML format that can be printed/saved as PDF)
 */
export const exportReportToPDF = async (reportData: ReportData) => {
  const logoBase64 = await getLogoBase64()
  
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportData.title}</title>
      <style>
        @page {
          margin: 20mm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .logo {
          height: 60px;
          margin-right: 20px;
        }
        .header-text {
          flex: 1;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #1f2937;
        }
        .header p {
          margin: 5px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }
        .report-info {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9fafb;
          border-radius: 8px;
        }
        .report-info p {
          margin: 5px 0;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-card {
          padding: 15px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : ''}
        <div class="header-text">
          <h1>${reportData.title}</h1>
          <p>Child Health Monitoring System - Report Generated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
      
      <div class="report-info">
        <p><strong>Report Type:</strong> ${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report</p>
        ${reportData.dateFrom ? `<p><strong>Date From:</strong> ${new Date(reportData.dateFrom).toLocaleDateString()}</p>` : ''}
        ${reportData.dateTo ? `<p><strong>Date To:</strong> ${new Date(reportData.dateTo).toLocaleDateString()}</p>` : ''}
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
  `

  // Add statistics for summary report
  if (reportData.type === 'summary' && reportData.stats) {
    content += `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Children</div>
          <div class="stat-value">${reportData.stats.totalChildren}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Photos</div>
          <div class="stat-value">${reportData.stats.totalPhotos}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">High Risk Cases</div>
          <div class="stat-value" style="color: #ef4444;">${reportData.stats.highRisk}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Analyzed Photos</div>
          <div class="stat-value" style="color: #10b981;">${reportData.stats.analyzedPhotos}</div>
        </div>
      </div>
    `
  }

  // Add data tables
  if (reportData.type === 'children' && reportData.children) {
    content += `
      <h2>Children Data</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Date of Birth</th>
            <th>Gender</th>
            <th>Village</th>
            <th>District</th>
            <th>Parent Name</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.children.map(child => `
            <tr>
              <td>${child.unique_id || child.id}</td>
              <td>${child.first_name} ${child.last_name}</td>
              <td>${new Date(child.date_of_birth).toLocaleDateString()}</td>
              <td>${child.gender}</td>
              <td>${child.village || '-'}</td>
              <td>${child.district || '-'}</td>
              <td>${child.parent_name || '-'}</td>
              <td>${child.parent_phone || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  if (reportData.type === 'photos' && reportData.photos) {
    content += `
      <h2>Photos & Analysis Data</h2>
      <table>
        <thead>
          <tr>
            <th>Photo ID</th>
            <th>Child Name</th>
            <th>Upload Date</th>
            <th>Analysis Status</th>
            <th>Malnutrition Score</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.photos.map(photo => {
            const riskLevel = photo.malnutrition_score !== null
              ? (photo.malnutrition_score > 0.6 ? 'High' : photo.malnutrition_score > 0.3 ? 'Medium' : 'Low')
              : 'N/A'
            return `
              <tr>
                <td>${photo.id}</td>
                <td>${photo.child_name || 'Unknown'}</td>
                <td>${new Date(photo.created_at).toLocaleDateString()}</td>
                <td>${photo.analysis_status || 'pending'}</td>
                <td>${photo.malnutrition_score !== null ? `${Math.round(photo.malnutrition_score * 100)}%` : 'N/A'}</td>
                <td>${riskLevel}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `
  }

  if (reportData.type === 'risk' && reportData.riskData) {
    content += `
      <h2>Risk Distribution by Location</h2>
      <table>
        <thead>
          <tr>
            <th>Location</th>
            <th>High Risk</th>
            <th>Medium Risk</th>
            <th>Low Risk</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.riskData.map((location: any) => {
            const total = (location.high || 0) + (location.medium || 0) + (location.low || 0)
            return `
              <tr>
                <td>${location.location}</td>
                <td style="color: #ef4444;">${location.high || 0}</td>
                <td style="color: #f59e0b;">${location.medium || 0}</td>
                <td style="color: #10b981;">${location.low || 0}</td>
                <td><strong>${total}</strong></td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `
    
    if (reportData.stats) {
      content += `
        <div class="stats-grid" style="margin-top: 30px;">
          <div class="stat-card">
            <div class="stat-label">Total High Risk</div>
            <div class="stat-value" style="color: #ef4444;">${reportData.stats.highRisk}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Medium Risk</div>
            <div class="stat-value" style="color: #f59e0b;">${reportData.stats.mediumRisk}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Low Risk</div>
            <div class="stat-value" style="color: #10b981;">${reportData.stats.lowRisk}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Analyzed</div>
            <div class="stat-value">${reportData.stats.analyzedPhotos}</div>
          </div>
        </div>
      `
    }
  }

  content += `
      <div class="footer">
        <p>This report was generated by the Child Health Monitoring System</p>
        <p>© ${new Date().getFullYear()} PostPart - All rights reserved</p>
      </div>
    </body>
    </html>
  `

  // Open in new window for printing/saving as PDF
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(content)
    printWindow.document.close()
    
    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * Export data to Excel (XLSX) format using a simple CSV approach
 * For true Excel format, you'd need a library like xlsx
 */
export const exportToExcel = (data: ExportData, filename: string) => {
  // For now, we'll export as CSV with .xlsx extension
  // In production, you might want to use a library like 'xlsx'
  exportToCSV(data, filename)
}

/**
 * Export children data
 */
export const exportChildren = (children: any[]) => {
  const data: ExportData = {
    headers: [
      'ID',
      'Unique ID',
      'First Name',
      'Last Name',
      'Date of Birth',
      'Gender',
      'Parent Name',
      'Village',
      'District',
      'Phone',
      'Address',
      'Birth Weight',
      'Has Disabilities',
      'Disability Details',
      'Created At'
    ],
    rows: children.map(child => [
      child.id,
      child.unique_id,
      child.first_name,
      child.last_name,
      child.date_of_birth,
      child.gender,
      child.parent_name || '',
      child.village || '',
      child.district || '',
      child.parent_phone || '',
      child.parent_address || '',
      child.birth_weight || '',
      child.has_disabilities ? 'Yes' : 'No',
      child.disability_details || '',
      new Date(child.created_at).toLocaleString()
    ])
  }
  
  exportToCSV(data, `children_export_${new Date().toISOString().split('T')[0]}`)
}

/**
 * Export photos/analysis data
 */
export const exportPhotos = (photos: any[], children: any[] = []) => {
  const data: ExportData = {
    headers: [
      'Photo ID',
      'Child Name',
      'Child ID',
      'Filename',
      'Upload Date',
      'Analysis Status',
      'Malnutrition Score',
      'Risk Level',
      'Confidence Level',
      'Recommendations',
      'Notes'
    ],
    rows: photos.map(photo => {
      const child = children.find((c: any) => c.id === photo.child_id)
      const childName = child ? `${child.first_name} ${child.last_name}` : 'Unknown'
      const riskLevel = photo.malnutrition_score !== null
        ? (photo.malnutrition_score > 0.6 ? 'High' : photo.malnutrition_score > 0.3 ? 'Medium' : 'Low')
        : 'N/A'
      
      return [
        photo.id,
        childName,
        photo.child_id,
        photo.filename || photo.file_name || '',
        new Date(photo.created_at).toLocaleString(),
        photo.analysis_status || 'pending',
        photo.malnutrition_score !== null ? `${Math.round(photo.malnutrition_score * 100)}%` : 'N/A',
        riskLevel,
        photo.confidence_level !== null ? `${Math.round(photo.confidence_level * 100)}%` : 'N/A',
        photo.recommendations ? (Array.isArray(photo.recommendations) ? photo.recommendations.join('; ') : photo.recommendations) : '',
        photo.notes || ''
      ]
    })
  }
  
  exportToCSV(data, `photos_export_${new Date().toISOString().split('T')[0]}`)
}

/**
 * Export summary report
 */
export const exportSummaryReport = (reportData: ReportData) => {
  exportReportToPDF(reportData)
}

/**
 * Export risk analysis report
 */
export const exportRiskReport = (reportData: ReportData) => {
  exportReportToPDF(reportData)
}

/**
 * Export growth records
 */
export const exportGrowthRecords = (records: any[], children: any[] = []) => {
  const data: ExportData = {
    headers: [
      'Record ID',
      'Child Name',
      'Child ID',
      'Measurement Date',
      'Weight (kg)',
      'Height (cm)',
      'BMI',
      'Head Circumference (cm)',
      'MUAC (cm)',
      'Weight Status',
      'Height Status',
      'Overall Status',
      'Weight-for-Age Z-Score',
      'Height-for-Age Z-Score',
      'Weight-for-Height Z-Score',
      'Measured By',
      'Notes',
      'Created At'
    ],
    rows: records.map(record => {
      const child = children.find((c: any) => c.id === record.child_id)
      const childName = child ? `${child.first_name} ${child.last_name}` : 'Unknown'
      
      return [
        record.id,
        childName,
        record.child_id,
        record.measurement_date,
        record.weight,
        record.height || '',
        record.bmi || '',
        record.head_circumference || '',
        record.mid_upper_arm_circumference || '',
        record.weight_status || '',
        record.height_status || '',
        record.overall_status || '',
        record.weight_for_age_zscore || '',
        record.height_for_age_zscore || '',
        record.weight_for_height_zscore || '',
        record.measured_by || '',
        record.notes || '',
        new Date(record.created_at).toLocaleString()
      ]
    })
  }
  
  exportToCSV(data, `growth_records_export_${new Date().toISOString().split('T')[0]}`)
}

