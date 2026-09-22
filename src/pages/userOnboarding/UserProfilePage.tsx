import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "@/ui/primitives/DataTable/DataTable";
import { apiService } from "@/services/api";
import { Button } from "@/ui/primitives/Button/Button";
import { Card } from "@/ui/primitives/Card/Card";
import { useTheme } from "@/ui/theme/ThemeContext";
import { usePermission } from "@/hooks/usePermissions";
import { Eye, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { UserPermissionsModal } from "./UserPermissionModal";
import { useActiveProfile } from "@/context/ProfileContext";
interface UserItem {
  isActive: boolean;
  accountCenterUserId: number;
  authUserId?: number; // ← needed for permission overrides
  authUserName: string;
  phoneNumber: string;
  appUserName: string;
  designation: string;
  notes: string;
  tenantProfileId?: number;
  tenantId?: number;
  assignedBy?: number;
  roleId?: number;
  statusName?: string;
  roleName?: string;
  profile?: {
    fullName?: string;
    whatsappNumber?: string;
    profileImageUrl?: string;
  };
}

const UserProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);

  // View modal
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  console.log("selectedUser", selectedUser);
  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);

  // Permissions modal
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionTarget, setPermissionTarget] = useState<UserItem | null>(
    null,
  );

  const { can } = usePermission();
  // const role = useRole();
  const canActOnManager = can("USER_EDIT_MANAGER");  
const canActOnAnalyst = can("USER_EDIT_ANALYST");

  // ── owner's authUserId for grantedBy ──
  const ownerAuthUserId: number =
    Number(
      JSON.parse(sessionStorage.getItem("ipc_post_login_bootstrap") || "{}")
        ?.identity?.authUserId,
    ) || 0;

  // ── tenant context ──
  // const tenantProfileId = JSON.parse(
  //   localStorage.getItem("auth.profileId") || "null",
  // );
  const tenantIdObj = JSON.parse(
    localStorage.getItem("auth.tenantId") || "null",
  );

  
  const profile = useActiveProfile();


  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res: any = await apiService.post<UserItem[]>(
        "idam/get_account_center_users",
        {
          tenantProfileId: profile.tenantProfileId, 
        tenantId: tenantIdObj?.value || tenantIdObj,
        },
      );
      setUsers(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (error) {
      console.error("Fetch Users Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile.profileId, profile.tenantProfileId]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchUsers();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // =========================
  // ACTIONS
  // =========================

  const handleViewUser = (item: UserItem) => {
    setSelectedUser(item);
    setOpen(true);
  };

  const handleEditUser = (item: UserItem) => {
    navigate(`/user-onboarding/${item.accountCenterUserId}`, {
      state: { user: item },
    });
  };

  const handleDeleteClick = (item: UserItem) => {
    setDeleteUser(item);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    try {
      setLoading(true);
      const res: any = await apiService.post("idam/update_account_center_user", {
        accountCenterUserId: deleteUser.accountCenterUserId,
        updatedBy: profile.tenantProfileId,
        isActive: false,
      });
      toast.success(res?.data?.data?.message || "Deleted successfully");
      fetchUsers();
      setDeleteOpen(false);
      setDeleteUser(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open the permissions modal for a specific user.
   * Requires authUserId - if the list API doesn't return it yet,
   * fall back to a quick GET by accountCenterUserId.
   */
  const handleOpenPermissions = async (item: UserItem) => {
    let target = item;

    if (!target.authUserId) {
      try {
        const res: any = await apiService.post(
          "idam/get_account_center_user_by_id",
          { accountCenterUserId: item.accountCenterUserId },
        );
        target = { ...item, authUserId: res?.data?.data?.authUserId };
      } catch {
        toast.error("Could not load user details. Please try again.");
        return;
      }
    }

    setPermissionTarget(target);
    setPermissionsOpen(true);
  };

  // =========================
  // TABLE COLUMNS
  // =========================

  const columns: Column<UserItem>[] = [
    {
      key: "profile",
      label: "Profile",
      render: (item: UserItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden rounded-full border">
            {item?.profile?.profileImageUrl ? (
              <img
                src={item.profile.profileImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-gray-200 ${item?.profile?.profileImageUrl ? "hidden" : ""}`}
            />
          </div>
          <div>
            <p className="font-medium">{item?.profile?.fullName || "-"}</p>
            <p className="text-xs text-gray-500">
              {item?.profile?.whatsappNumber || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "authUserName",
      label: "Email",
      render: (item: UserItem) => item.authUserName || "-",
    },
    // {
    //   key: "phoneNumber",
    //   label: "Phone",
    //   render: (item: UserItem) => item.phoneNumber || "-",
    // },
    {
      key: "designation",
      label: "Designation",
      render: (item: UserItem) => item.designation || "-",
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: UserItem) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            item.isActive
              ? "bg-green-200 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  // Conditionally render the actions column only when the user has permission
  const renderActions = (canActOnManager || canActOnAnalyst)
  ? (item: UserItem) => {
      const designation = (item.designation ?? "").toLowerCase();
      const isManager = designation.includes("manager");
      const isAnalyst = designation.includes("analyst");

      // Decide if logged-in user can act on THIS specific row
      const canActOnRow =
        (isManager && canActOnManager) ||
        (isAnalyst && canActOnAnalyst);

      // Hide entire cell for rows the logged-in user has no rights over
      if (!canActOnRow) return null;

      return (
        <div className="flex items-center justify-end gap-2">

          {/* View - same gate as edit */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-gray-100"
            style={{ borderColor: theme.colors.border }}
            onClick={() => handleViewUser(item)}
            title="View User"
          >
            <Eye size={18} />
          </button>

          {/* Edit */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-blue-50"
            style={{ borderColor: theme.colors.border }}
            onClick={() => handleEditUser(item)}
            title="Edit User"
          >
            <Pencil size={18} />
          </button>

          {/* Permissions */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-emerald-50"
            style={{ borderColor: theme.colors.border }}
            onClick={() => handleOpenPermissions(item)}
            title="Manage Permissions"
          >
            <ShieldCheck size={18} className="text-emerald-600" />
          </button>

          {/* Delete - uses the separate DELETE permission */}
          {((isManager && can("USER_DELETE_MANAGER")) ||
            (isAnalyst && can("USER_DELETE_ANALYST"))) && (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-red-50"
              style={{ borderColor: theme.colors.border }}
              onClick={() => handleDeleteClick(item)}
              title="Delete User"
            >
              <Trash2 size={18} style={{ color: theme.colors.danger }} />
            </button>
          )}

        </div>
      );
    }
  : undefined;
  // =========================
  // RENDER
  // =========================

  return (
    <div className="w-full p-5">
      <Card>
        {/* Header */}
        <div className="mb-5 flex items-center justify-end">
          <Button
            variant="primary"
            className="cursor-pointer flex items-center gap-2"
            onClick={() => navigate("/user-onboarding")}
          >
            <Plus size={16} />
            Add User
          </Button>
        </div>

        {/* Table */}
        <DataTable
          title="Users"
          data={users}
          columns={columns}
          searchKey="authUserName"
          enableGridView={false}
          enableFilter
          enableInputFilter
          enableSliderFilter
          rowOnClick
          onRowClick={(item: UserItem) => console.log("Row Click", item)}
          actions={renderActions}
          emptyMessage="No users found"
        />
      </Card>

      {/* ── View Modal ── */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="User Profile"
        size="4xl"
      >
        {selectedUser && (
          <div className="overflow-hidden rounded-2xl bg-white">
            {/* Header */}
            <div className="relative h-32">
              <div className="absolute -bottom-1 left-6">
                <img
                  src={selectedUser?.profile?.profileImageUrl}
                  alt="Profile"
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                />
              </div>
            </div>

            {/* Content */}
            <div className="pt-16 px-6 pb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedUser?.profile?.fullName || "-"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedUser?.designation || "-"}
                </p>
                <div
                  className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    selectedUser?.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedUser?.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 mb-1">User Name</p>
                  <p className="font-medium">
                    {selectedUser?.profile?.fullName || "-"}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-medium break-all">
                    {selectedUser?.authUserName || "-"}
                  </p>
                </div>
                {/* <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="font-medium">
                    {selectedUser?.phoneNumber || "-"}
                  </p>
                </div> */}
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                  <p className="font-medium">
                    {selectedUser?.profile?.whatsappNumber || "-"}
                  </p>
                </div>
                {/* <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 mb-1">Username</p>
                  <p className="font-medium">
                    {selectedUser?.appUserName || "-"}
                  </p>
                </div> */}
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <p className="font-medium">
                    {selectedUser?.designation || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {/* <Button variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button> */}

                {/* Permissions shortcut from view modal */}
                {/* <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    handleOpenPermissions(selectedUser);
                  }}
                  className="flex items-center gap-2"
                >
                  <ShieldCheck size={15} />
                  Permissions
                </Button> */}

                <Button
                  onClick={() =>
                    navigate(
                      `/user-onboarding/${selectedUser?.accountCenterUserId}`,
                      { state: { user: selectedUser } },
                    )
                  }
                >
                  Edit User
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteUser(null);
        }}
        title="Delete User"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: theme.colors.dangerBg }}
            >
              <Trash2 size={22} style={{ color: theme.colors.danger }} />
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold text-lg"
                style={{ color: theme.colors.text }}
              >
                Delete User?
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Are you sure you want to delete
                <strong> {deleteUser?.profile?.fullName || "this user"}</strong>
                ? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Permissions Modal ── */}
      {permissionTarget && (
        <UserPermissionsModal
          isOpen={permissionsOpen}
          onClose={() => {
            setPermissionsOpen(false);
            setPermissionTarget(null);
          }}
          authUserId={permissionTarget.authUserId ?? 0}
          grantedBy={ownerAuthUserId}
          userName={
            permissionTarget.profile?.fullName ||
            permissionTarget.authUserName ||
            "User"
          }
          roleName={permissionTarget.designation}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
