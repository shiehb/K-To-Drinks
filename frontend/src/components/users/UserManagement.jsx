"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import api, { ENDPOINTS } from "../../api/api_url"
import { Archive, Edit, Search, UserPlus, Eye, ArchiveRestore } from "lucide-react"
import jsPDF from "jspdf"
import { useLongPress } from "@/hooks/useLongPress"

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/DataTable"

import "../../css/usermanagement.css"

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Removed unused statusFilter state
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const inputRef = useRef(null);
  const [userForm, setUserForm] = useState({
    id: null,
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: "employee",
    status: "active",
    password: "",
    confirm_password: "",
  });
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [viewUser, setViewUser] = useState(null);

  const handleClickOutside = useCallback((event) => {
    const tableElement = document.querySelector('.table-container');
    if (tableElement && !tableElement.contains(event.target) && showCheckboxes) {
      if (selectedUsers.length === 0) {
        setShowCheckboxes(false);
      }
    }
  }, [showCheckboxes, selectedUsers]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const longPressProps = useLongPress(() => {
    if (!showCheckboxes) {
      setShowCheckboxes(true);
      toast.info("Selection mode activated", {
        autoClose: 2000,
        position: "bottom-center"
      });
    }
  }, 500);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      // Add archive status to params
      params.append('is_archived', activeTab === 'archived');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`${ENDPOINTS.USERS}?${params.toString()}`);
      
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(timer);
  }, [fetchUsers, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // First filter by archive status
      if (activeTab === 'archived' && user.status !== 'archived') {
        return false;
      }
      if (activeTab === 'active' && user.status === 'archived') {
        return false;
      }

      // Then filter by role if selected
      if (roleFilter && roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      
      // Finally filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.username?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [users, activeTab, roleFilter, searchTerm]);

  // Handle User Form Submission
  const handleUserFormSubmit = async (e) => {
    e.preventDefault()

    if (!userForm.id && userForm.password !== userForm.confirm_password) {
      toast.error("Passwords do not match.")
      return
    }

    showConfirmationDialog(
      "Save Changes",
      `Are you sure you want to ${userForm.id ? "update" : "add"} this user?`,
      async () => {
        setIsLoading(true)

        try {
          const payload = {
            ...userForm,
            password: userForm.password,
          }

          const url = userForm.id ? `/users/${userForm.id}/` : `/users/`
          const method = userForm.id ? "put" : "post"

          const response = await api({
            url,
            method,
            data: payload,
          })

          const data = response.data
          if (userForm.id) {
            setUsers(users.map((user) => (user.id === userForm.id ? data : user)))
          } else {
            setUsers([...users, data])
          }

          toast.success(`User ${userForm.id ? "updated" : "added"} successfully!`)
          setIsUserModalOpen(false)
          resetUserForm()
        } catch (error) {
          console.error("User save error:", error.response?.data || error)
          toast.error("Failed to save user.")
        } finally {
          setIsLoading(false)
        }
      }
    )
  }

  // Reset user form to default values
  const resetUserForm = () => {
    setUserForm({
      id: null,
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      role: "employee",
      status: "active",
      password: "",
      confirm_password: "",
    })
  }

  // Show confirmation dialog
  const showConfirmationDialog = (title, message, onConfirm) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
    })
  }

  // Archive User
  const handleArchiveUser = (id) => {
    showConfirmationDialog(
      "Archive User",
      "Are you sure you want to archive this user?",
      () => confirmArchive(id)
    )
  }

  const confirmArchive = async (id) => {
    try {
      const response = await api.patch(`/users/${id}/`, { status: "archived" })
      const updatedUser = response.data
      setUsers(users.map((user) => (user.id === id ? updatedUser : user)))
      toast.success("User archived successfully!")
    } catch (error) {
      console.error("Archive error:", error.response || error)
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to archive user"
      toast.error(errorMsg)
    }
  }

  // Unarchive User
  const handleUnarchiveUser = (id) => {
    showConfirmationDialog(
      "Unarchive User",
      "Are you sure you want to unarchive this user?",
      () => confirmUnarchive(id)
    )
  }

  const confirmUnarchive = async (id) => {
    try {
      const response = await api.patch(`/users/${id}/`, { status: "active" })
      const updatedUser = response.data
      setUsers(users.map((user) => (user.id === id ? updatedUser : user)))
      toast.success("User unarchived successfully!")
    } catch (error) {
      console.error("Unarchive error:", error.response || error)
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to unarchive user"
      toast.error(errorMsg)
    }
  }

  // Generate PDF for a user
  const generatePDF = (user) => {
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("K-TO-DRINKS TRADING", 105, 15, { align: "center" })

    doc.setFontSize(14)
    doc.setFont("helvetica", "italic")
    doc.text("User Information Report", 105, 25, { align: "center" })

    doc.setLineWidth(0.5)
    doc.line(55, 30, 155, 30)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const userDetails = [
      { label: "ID", value: user.id },
      { label: "Username", value: user.username },
      { label: "Full Name", value: `${user.first_name} ${user.last_name}` },
      { label: "Email", value: user.email || "No email added" },
      { label: "Phone", value: user.phone_number },
      { label: "Role", value: getRoleDisplayName(user.role) },
      { label: "Status", value: user.status },
      {
        label: "Date Joined",
        value: user.date_joined
          ? new Date(user.date_joined).toLocaleDateString("en-US")
          : "N/A",
      },
    ]

    let yPosition = 40
    userDetails.forEach((detail) => {
      doc.setFont("helvetica", "bold")
      doc.text(`${detail.label}:`, 60, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(`${detail.value}`, 100, yPosition)
      yPosition += 10
    })

    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text(
      "Generated by K-To-Drinks User Management System",
      105,
      280,
      { align: "center" }
    )

    window.open(doc.output("bloburl"), "_blank")
  }

  // Utility Functions
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  const openUserModal = (user = null) => {
    if (user) {
      setUserForm({ ...user })
    } else {
      resetUserForm()
    }
    setIsUserModalOpen(true)
  }

  const handleCancel = () => {
    showConfirmationDialog("Cancel Changes", "Are you sure you want to cancel? Unsaved changes will be lost.", () =>
      setIsUserModalOpen(false)
    )
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "employee":
        return "Employee"
      default:
        return "Unknown Role"
    }
  }

  // Define table columns
  const columns = [
    {
      key: "username",
      header: "Username",
      sortable: true,
      className: "font-medium"
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (user) => `${user.first_name} ${user.last_name}`
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
    },
    {
      key: "phone_number",
      header: "Phone Number",
      sortable: true,
      render: (user) => user.phone_number || "N/A"
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (user) => (
        <Badge variant="outline" className="capitalize">
          {getRoleDisplayName(user.role)}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "", // Remove the "Actions" text by setting header to empty string
      className: "text-right",
      render: (user) => (
        <div className="flex justify-end gap-4">
          <button
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              openUserModal(user);
            }}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              if (user.status === "active") {
                handleArchiveUser(user.id);
              } else {
                handleUnarchiveUser(user.id);
              }
            }}
            title={user.status === "active" ? "Archive" : "Restore"}
          >
            {user.status === "active" ? (
              <Archive className="h-4 w-4" />
            ) : (
              <ArchiveRestore className="h-4 w-4" />
            )}
          </button>
          <button
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              setViewUser(user);
            }}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  // Add error boundary fallback
  if (error) {
    return (
      <div className="error-container">
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <Button onClick={() => fetchUsers()}>Try Again</Button>
      </div>
    );
  }

  return (
    <Card className="user-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <div className="search-input-container w-[400px]"> {/* Add fixed width here */}
            <Search className="search-icon" />
            <Input 
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={handleFocus}
              ref={inputRef}
              className="search-input"
            />
          </div>
          <div className="button-group">
            <Button onClick={() => openUserModal()} size="sm" className="add-button">
              <UserPlus className="icon" />
              Add User
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="card-content">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <div className="filter-container">
            <div className="flex justify-between items-center w-full">
              <TabsList className="tabs-list">
                <TabsTrigger value="active" className="tab">
                  Active Users
                </TabsTrigger>
                <TabsTrigger value="archived" className="tab">
                  Archived Users
                </TabsTrigger>
                <Select value={roleFilter} onValueChange={setRoleFilter} className="role-select">
                <SelectTrigger className="select-trigger w-[160px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  <SelectItem value="all" className="select-item">
                    All Roles
                  </SelectItem>
                  <SelectItem value="admin" className="select-item">
                    Admin
                  </SelectItem>
                  <SelectItem value="employee" className="select-item">
                    Employee
                  </SelectItem>
                </SelectContent>
              </Select>
              </TabsList>
            </div>
          </div>

          <div 
            {...longPressProps} 
            onTouchStart={longPressProps.onTouchStart}
            onTouchEnd={longPressProps.onTouchEnd}
            className="table-wrapper"
          >
            <DataTable
              columns={columns}
              data={filteredUsers}
              isLoading={isLoading}
              showCheckboxes={showCheckboxes}
              selectedItems={selectedUsers}
              onSelectionChange={(selected) => {
                setSelectedUsers(selected);
              }}
              emptyMessage={
                searchTerm || roleFilter
                  ? "No users match the current filters"
                  : "No users found"
              }
              loadingMessage="Loading users..."
            />
          </div>
        </Tabs>

        {isUserModalOpen && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <h2 className="modal-title">{userForm.id ? "Edit User" : "Add User"}</h2>

              <form onSubmit={handleUserFormSubmit} className="user-form">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username:
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="Enter username"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="first_name" className="form-label">
                    First Name:
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                    placeholder="Enter first name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name" className="form-label">
                    Last Name:
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                    placeholder="Enter last name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email:
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="Enter email address (optional)"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone_number" className="form-label">
                    Phone Number:
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={userForm.phone_number}
                    onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Role:
                  </label>
                  <select
                    id="role"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="form-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password:
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Enter password"
                    required={!userForm.id}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password" className="form-label">
                    Confirm Password:
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    value={userForm.confirm_password || ""}
                    onChange={(e) => setUserForm({ ...userForm, confirm_password: e.target.value })}
                    placeholder="Confirm password"
                    required={!userForm.id}
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? "Saving..." : userForm.id ? "Save" : "Add User"}
                  </button>

                  <button type="button" onClick={handleCancel} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewUser && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <div className="modal-header">
                <h2 className="modal-title">User Information</h2>
                <button
                  className="close-button"
                  onClick={() => setViewUser(null)}
                  aria-label="Close"
                  title="Close"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="user-details">
                <p><strong>ID:</strong> {viewUser.id}</p>
                <p><strong>Username:</strong> {viewUser.username}</p>
                <p><strong>Full Name:</strong> {viewUser.first_name} {viewUser.last_name}</p>
                <p><strong>Email:</strong> {viewUser.email || "No email added"}</p>
                <p><strong>Phone:</strong> {viewUser.phone_number}</p>
                <p><strong>Role:</strong> {getRoleDisplayName(viewUser.role)}</p>
                <p><strong>Status:</strong> {viewUser.status}</p>
                <p>
                  <strong>Date Joined:</strong>{" "}
                  {viewUser.date_joined
                    ? new Date(viewUser.date_joined).toLocaleDateString("en-US")
                    : "N/A"}
                </p>
              </div>
              <div className="modal-actions">
                <Button onClick={() => generatePDF(viewUser)} variant="outline" size="sm">
                  Print PDF
                </Button>
                <Button onClick={() => setViewUser(null)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {confirmationDialog.isOpen && (
          <div className="custom-modal-overlay">
            <div className="custom-modal confirmation-modal">
              <div className="confirmation-icon">
                <span className="material-icons">warning</span>
              </div>
              <h3 className="confirmation-title">{confirmationDialog.title}</h3>
              <p className="confirmation-message">{confirmationDialog.message}</p>
              <div className="confirmation-actions">
                <button
                  onClick={() => setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmationDialog.onConfirm()
                    setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))
                  }}
                  className="confirm-button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}