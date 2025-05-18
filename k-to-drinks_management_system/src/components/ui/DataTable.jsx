"use client"

import { useState, useRef } from "react"
import PropTypes from "prop-types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCcw } from "lucide-react"
import "@/css/datatable.css"

export const DataTable = ({
  columns,
  data,
  isLoading,
  showCheckboxes,
  selectedItems = [],
  onSelectionChange,
  emptyMessage = "No data found",
  loadingMessage = "Loading data...",
  onRowMouseEnter,
  onRowMouseLeave,
  onRowMouseMove,
}) => {
  const tableRef = useRef(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Sort data
  const sortedData = Array.isArray(data)
    ? [...data].sort((a, b) => {
        if (!sortConfig.key) return 0

        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    : []

  // Add checkbox handling
  const handleSelectAll = () => {
    if (onSelectionChange) {
      const allIds = sortedData.map((item) => item.id)
      const newSelection = selectedItems.length === sortedData.length ? [] : allIds
      onSelectionChange(newSelection)
    }
  }

  const handleSelectItem = (itemId) => {
    if (onSelectionChange) {
      const newSelection = selectedItems.includes(itemId)
        ? selectedItems.filter((id) => id !== itemId)
        : [...selectedItems, itemId]
      onSelectionChange(newSelection)
    }
  }

  return (
    <div className="table-container">
      <Table ref={tableRef} className="data-table">
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={data.length > 0 && selectedItems.length === data.length}
                  onChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.className || ""} ${column.sortable ? "cursor-pointer select-none" : ""}`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && sortConfig.key === column.key && (
                    <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? columns.length + 1 : columns.length} className="loading-cell">
                <div className="loading-indicator">
                  <RefreshCcw className="loading-icon" />
                  {loadingMessage}
                </div>
              </TableCell>
            </TableRow>
          ) : sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? columns.length + 1 : columns.length} className="empty-cell">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item) => (
              <TableRow
                key={item.id}
                className={selectedItems.includes(item.id) ? "selected" : ""}
                onMouseEnter={(e) => onRowMouseEnter && onRowMouseEnter(item, e)}
                onMouseLeave={() => onRowMouseLeave && onRowMouseLeave()}
                onMouseMove={(e) => onRowMouseMove && onRowMouseMove(e)}
              >
                {showCheckboxes && (
                  <TableCell className="w-[50px]">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`${column.className} ${column.key === "actions" ? "actions-column sticky-right" : ""}`}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      className: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  showCheckboxes: PropTypes.bool,
  selectedItems: PropTypes.arrayOf(PropTypes.string),
  onSelectionChange: PropTypes.func,
  emptyMessage: PropTypes.string,
  loadingMessage: PropTypes.string,
  onRowMouseEnter: PropTypes.func,
  onRowMouseLeave: PropTypes.func,
  onRowMouseMove: PropTypes.func,
}
