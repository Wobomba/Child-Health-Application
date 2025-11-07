import { useState } from 'react'
import { CheckSquare, Square, Trash2, Download, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface BulkActionsProps<T> {
  items: T[]
  selectedItems: number[]
  onSelectionChange: (selected: number[]) => void
  onBulkDelete?: (ids: number[]) => Promise<void>
  onBulkExport?: (items: T[]) => void
  getItemId: (item: T) => number
  itemName?: string
}

const BulkActions = <T,>({
  items,
  selectedItems,
  onSelectionChange,
  onBulkDelete,
  onBulkExport,
  getItemId,
  itemName = 'items'
}: BulkActionsProps<T>) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const allSelected = items.length > 0 && selectedItems.length === items.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map(item => getItemId(item)))
    }
  }

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return
    
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} ${itemName}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await onBulkDelete(selectedItems)
      toast.success(`Successfully deleted ${selectedItems.length} ${itemName}`)
      onSelectionChange([])
    } catch (error) {
      toast.error(`Failed to delete ${itemName}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkExport = () => {
    if (!onBulkExport) return
    
    const selectedItemsData = items.filter(item => 
      selectedItems.includes(getItemId(item))
    )
    onBulkExport(selectedItemsData)
    toast.success(`Exported ${selectedItems.length} ${itemName}`)
  }

  if (selectedItems.length === 0) {
    return null
  }

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-primary-700 hover:text-primary-900"
          >
            {allSelected ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            <span className="font-medium">
              {selectedItems.length} {itemName} selected
            </span>
          </button>
          <button
            onClick={() => onSelectionChange([])}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {onBulkExport && (
            <button
              onClick={handleBulkExport}
              className="btn btn-secondary flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </button>
          )}
          {onBulkDelete && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="btn btn-danger flex items-center text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkActions

