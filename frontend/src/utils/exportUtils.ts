/**
 * Utility functions for exporting data to CSV/Excel formats
 */

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
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

