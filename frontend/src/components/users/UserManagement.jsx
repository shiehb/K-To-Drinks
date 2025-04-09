"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "react-toastify"
import api from "../../api/api_url"
import { Archive, Download, Edit, RefreshCcw, Search, UserPlus, Eye } from "lucide-react"
import bcrypt from "bcryptjs"
import jsPDF from "jspdf";

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import "../../css/usermanagement.css"

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  const inputRef = useRef(null); // Define inputRef
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
  })
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showCheckboxes, setShowCheckboxes] = useState(false) // State to control checkbox visibility
  const longPressTimer = useRef(null)
  const tableRef = useRef(null) // Reference to the table
  const [viewUser, setViewUser] = useState(null); // Add this line

  // Handle long press start
  const handleLongPressStart = (userId) => {
    longPressTimer.current = setTimeout(() => {
      setShowCheckboxes(true) // Show checkboxes on long press
      if (!selectedUsers.includes(userId)) {
        setSelectedUsers((prev) => [...prev, userId])
      }
    }, 500) // Trigger after 500ms
  }

  // Handle long press end
  const handleLongPressEnd = () => {
    clearTimeout(longPressTimer.current)
  }

  // Handle checkbox toggle
  const handleCheckboxChange = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId) // Remove if already selected
        : [...prevSelected, userId] // Add if not selected
    )
  }

  // Hide checkboxes when clicking outside the table
  const handleClickOutside = (event) => {
    if (
      tableRef.current &&
      !tableRef.current.contains(event.target) &&
      selectedUsers.length === 0
    ) {
      setShowCheckboxes(false) // Hide checkboxes if no users are selected
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedUsers])

  // Filter Users
  const filteredUsers = users.filter(
    (user) =>
      (activeTab === "archived" ? user.status === "archived" : user.status === "active") &&
      (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (roleFilter === "all" || roleFilter === "" || user.role === roleFilter)
  )

  // Check if all users are selected
  const isAllSelected = filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length

  // Handle "Select All" checkbox
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers([]) // Deselect all
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id)) // Select all
    }
  }

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const response = await api.get("/users/")
        setUsers(response.data)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast.error("Failed to fetch users.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Handle User Form Submission
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();

    // Validate Confirm Password
    if (!userForm.id && userForm.password !== userForm.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    // Proceed with saving the user
    showConfirmationDialog(
      "Save Changes",
      `Are you sure you want to ${userForm.id ? "update" : "add"} this user?`,
      async () => {
        setIsLoading(true);

        try {
          const hashedPassword = userForm.password
            ? await bcrypt.hash(userForm.password, 10)
            : undefined;

          const payload = {
            ...userForm,
            password: hashedPassword,
          };

          const url = userForm.id ? `/users/${userForm.id}/` : `/users/`;
          const method = userForm.id ? "put" : "post";

          const response = await api({
            url,
            method,
            data: payload,
          });

          const data = response.data;
          if (userForm.id) {
            setUsers(users.map((user) => (user.id === userForm.id ? data : user)));
          } else {
            setUsers([...users, data]);
          }

          toast.success(`User ${userForm.id ? "updated" : "added"} successfully!`);
          setIsUserModalOpen(false);
          resetUserForm();
        } catch (error) {
          console.error("User save error:", error.response?.data || error);
          toast.error("Failed to save user.");
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

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
    });
  }

  // Archive User
  const handleArchiveUser = (id) => {
    showConfirmationDialog(
      "Archive User",
      "Are you sure you want to archive this user?",
      () => confirmArchive(id)
    );
  };

  const confirmArchive = async (id) => {
    try {
      const response = await api.patch(`/users/${id}/`, { status: "archived" });
      const updatedUser = response.data;
      setUsers(users.map((user) => (user.id === id ? updatedUser : user)));
      toast.success("User archived successfully!");
    } catch (error) {
      console.error("Archive error:", error.response || error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to archive user";
      toast.error(errorMsg);
    }
  };

  // Unarchive User
  const handleUnarchiveUser = (id) => {
    showConfirmationDialog(
      "Unarchive User",
      "Are you sure you want to unarchive this user?",
      () => confirmUnarchive(id)
    );
  };

  const confirmUnarchive = async (id) => {
    try {
      const response = await api.patch(`/users/${id}/`, { status: "active" });
      const updatedUser = response.data;
      setUsers(users.map((user) => (user.id === id ? updatedUser : user)));
      toast.success("User unarchived successfully!");
    } catch (error) {
      console.error("Unarchive error:", error.response || error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to unarchive user";
      toast.error(errorMsg);
    }
  };

  // Export Users to CSV
  const exportUsers = () => {
    try {
      if (selectedUsers.length === 0) {
        toast.error("No users selected for export.")
        return
      }

      const now = new Date()
      const date = now.toISOString().split("T")[0]
      const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")

      const headers = ["ID", "Username", "First Name", "Last Name", "Email", "Phone", "Role", "Status"]
      const csvContent =
        "data:text/csv;charset=utf-8," +
        headers.join(",") +
        "\n" +
        filteredUsers
          .filter((user) => selectedUsers.includes(user.id))
          .map((user) => {
            const escapedEmail = `"${user.email}"`
            return [
              user.id,
              user.username,
              user.first_name,
              user.last_name,
              escapedEmail,
              user.phone_number,
              user.role,
              user.status,
            ].join(",")
          })
          .join("\n")

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `users_export_${date}_${time}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("User data exported successfully!")
    } catch (error) {
      toast.error(`Failed to export user data: ${error.message || "Unknown error"}`)
    }
  }

  // Generate PDF for a user
  const generatePDF = (user) => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.text("User Information", 10, 10)

    // Add user details
    doc.setFontSize(12)
    doc.text(`ID: ${user.id}`, 10, 20)
    doc.text(`Username: ${user.username}`, 10, 30)
    doc.text(`Full Name: ${user.first_name} ${user.last_name}`, 10, 40)
    doc.text(`Email: ${user.email || "No email added"}`, 10, 50)
    doc.text(`Phone: ${user.phone_number}`, 10, 60)
    doc.text(`Role: ${getRoleDisplayName(user.role)}`, 10, 70)
    doc.text(`Status: ${user.status}`, 10, 80)
    doc.text(
      `Date Joined: ${
        user.date_joined ? new Date(user.date_joined).toLocaleDateString("en-US") : "N/A"
      }`,
      10,
      90
    )

    // Save the PDF
    doc.save(`user_${user.username || user.id}.pdf`)
  }

  // Utility Functions
  const capitalizeEachWord = (str) => {
    if (!str) return ""
    return str.replace(/\b\w/g, (char) => char.toUpperCase())
  }

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

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "employee":
        return "Employee";
      default:
        return "Unknown Role";
    }
  }

  return (
    <Card className="user-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <CardTitle className="card-title">User Management</CardTitle>
          <div className="button-group">
            <Button onClick={() => openUserModal()} size="sm" className="add-button">
              <UserPlus className="icon" />
              Add User
            </Button>
            {selectedUsers.length > 0 && (
              <Button onClick={exportUsers} variant="outline" size="sm" className="export-button">
                <Download className="icon" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="card-content">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <div className="filter-container">
            <TabsList className="tabs-list">
              <TabsTrigger value="active" className="tab">
                Active Users
              </TabsTrigger>
              <TabsTrigger value="archived" className="tab">
                Archived Users
              </TabsTrigger>
            </TabsList>
            <div className="search-container">
              <div className="search-input-container">
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
              <Select value={roleFilter} onValueChange={setRoleFilter} className="role-select">
                <SelectTrigger className="select-trigger">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  <SelectItem value="all" className="select-item">
                    All Roles
                  </SelectItem>
                  <SelectItem value="manager" className="select-item">
                    Manager
                  </SelectItem>
                  <SelectItem value="delivery_driver" className="select-item">
                    Delivery Driver
                  </SelectItem>
                  <SelectItem value="employee" className="select-item">
                    Employee
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="status-container">
            <div className="status-content">
              <div className="status-text">
                {isLoading ? (
                  <span>Loading users...</span>
                ) : (
                  <span>
                    Showing <strong>{filteredUsers.length}</strong> of{" "}
                    <strong>
                      {
                        users.filter((user) =>
                          activeTab === "archived" ? user.status === "archived" : user.status === "active"
                        ).length
                      }
                    </strong>{" "}
                    {activeTab} users
                  </span>
                )}
              </div>
            </div>
          </div>

          <TabsContent value="active" className="tab-content">
            <div className="table-container">
              <Table className="user-table" ref={tableRef}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">
                      {showCheckboxes && ( // Only show "Select All" checkbox if `showCheckboxes` is true
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          aria-label="Select all users"
                        />
                      )}
                    </TableHead>
                    <TableHead className="text-center">Username</TableHead>
                    <TableHead className="text-center">Full Name</TableHead>
                    <TableHead className="email-column text-center">Email</TableHead>
                    <TableHead className="text-center">Phone</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Date Added</TableHead>
                    <TableHead className="actions-column text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="loading-cell text-center">
                        <div className="loading-indicator flex justify-center items-center">
                          <RefreshCcw className="loading-icon" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="empty-cell text-center">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        onMouseDown={() => handleLongPressStart(user.id)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(user.id)}
                        onTouchEnd={handleLongPressEnd}
                      >
                        <TableCell className="text-center">
                          {showCheckboxes && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleCheckboxChange(user.id)}
                              aria-label={`Select user ${user.username}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">{user.username}</TableCell>
                        <TableCell className="text-center">
                          {`${capitalizeEachWord(user.first_name)} ${capitalizeEachWord(user.last_name)}`}
                        </TableCell>
                        <TableCell className="email-cell text-center">
                          {user.email ? user.email : "No email added"}
                        </TableCell>
                        <TableCell className="text-center">{user.phone_number}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="role-badge mx-auto">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.date_joined ? new Date(user.date_joined).toLocaleDateString("en-US") : "N/A"}
                        </TableCell>
                        <TableCell className="actions-cell text-center border border-gray-200 px-4 py-2">
                          <div className="actions-container flex justify-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewUser(user)} // Set the user to view
                              className="action-button"
                            >
                              <Eye className="action-icon" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUserModal(user)}
                              className="action-button"
                            >
                              <Edit className="action-icon" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchiveUser(user.id)}
                              className="action-button"
                            >
                              <Archive className="action-icon" />
                              <span className="sr-only">Archive</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="archived" className="tab-content">
            <div className="table-container">
              <Table className="user-table" ref={tableRef}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">
                      {showCheckboxes && ( // Only show "Select All" checkbox if `showCheckboxes` is true
                        <input
                          type="checkbox"
                          checked={
                            filteredUsers.length > 0 &&
                            selectedUsers.length === filteredUsers.length
                          }
                          onChange={handleSelectAll}
                          aria-label="Select all archived users"
                        />
                      )}
                    </TableHead>
                    <TableHead className="text-center">Username</TableHead>
                    <TableHead className="text-center">Full Name</TableHead>
                    <TableHead className="email-column text-center">Email</TableHead>
                    <TableHead className="text-center">Phone</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Date Added</TableHead>
                    <TableHead className="actions-column text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="loading-cell text-center">
                        <div className="loading-indicator flex justify-center items-center">
                          <RefreshCcw className="loading-icon" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="empty-cell text-center">
                        No archived users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        onMouseDown={() => handleLongPressStart(user.id)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(user.id)}
                        onTouchEnd={handleLongPressEnd}
                      >
                        <TableCell className="text-center">
                          {showCheckboxes && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleCheckboxChange(user.id)}
                              aria-label={`Select archived user ${user.username}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">{user.username}</TableCell>
                        <TableCell className="text-center">
                          {`${capitalizeEachWord(user.first_name)} ${capitalizeEachWord(user.last_name)}`}
                        </TableCell>
                        <TableCell className="email-cell text-center">
                          {user.email ? user.email : "No email added"}
                        </TableCell>
                        <TableCell className="text-center">{user.phone_number}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="role-badge mx-auto">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.date_joined
                            ? new Date(user.date_joined).toLocaleDateString("en-US")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="actions-cell text-center">
                          <div className="actions-container flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewUser(user)} // Set the user to view
                              className="action-button"
                            >
                              <Eye className="action-icon" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnarchiveUser(user.id)}
                              className="restore-button mx-auto"
                            >
                              <RefreshCcw className="action-icon" />
                              Restore
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
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
                    required={!userForm.id} // Required only for new users
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
                    required={!userForm.id} // Required only for new users
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
                  Download PDF
                </Button>
                <Button onClick={() => setViewUser(null)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
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
                    confirmationDialog.onConfirm();
                    setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
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