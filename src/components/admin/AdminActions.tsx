import React, { useState, useEffect } from "react";
import { Switch, TextInput, Button, Table, Pagination, Modal } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { supabase } from "../../supabase";
import "./AdminActions.css";

type FeatureKeys = "application_form";
type AdminRole = "admin" | "support";

interface Feature {
  feature_name: FeatureKeys;
  status: "enabled" | "disabled";
  cooldown_time: number;
}

interface Admin {
  id: number;
  email: string;
  username: string;
  role: AdminRole;
}

const AdminActions: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [editingFeature, setEditingFeature] = useState<null | Feature>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);
  const [cooldownLoading, setCooldownLoading] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState<number | null>(null);
  const [adminToRemove, setAdminToRemove] = useState<null | Admin>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchFeaturesAndAdmins = async () => {
      const { data: featuresData, error: featuresError } = await supabase
        .from("features")
        .select("feature_name, status, cooldown_time");

      if (featuresError) {
        Notifications.show({
          title: "Error",
          message: "Failed to fetch features.",
          color: "red",
        });
      } else {
        setFeatures(featuresData || []);
      }

      const {
        data: adminsData,
        count,
        error: adminsError,
      } = await supabase
        .from("admins")
        .select("*", { count: "exact" })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (adminsError) {
        Notifications.show({
          title: "Error",
          message: "Failed to fetch admins.",
          color: "red",
        });
      } else {
        setAdmins(adminsData || []);
        setTotalAdmins(count || 0);
      }
    };

    fetchFeaturesAndAdmins();
  }, [page, pageSize]);

  const toggleFeatureStatus = async (feature: Feature) => {
    setSwitchLoading(feature.feature_name);
    const updatedStatus = feature.status === "enabled" ? "disabled" : "enabled";

    try {
      const { error } = await supabase
        .from("features")
        .update({ status: updatedStatus })
        .eq("feature_name", feature.feature_name);

      if (error) {
        Notifications.show({
          title: "Error",
          message: "Failed to update feature status.",
          color: "red",
        });
      } else {
        setFeatures((prev) =>
          prev.map((f) =>
            f.feature_name === feature.feature_name
              ? { ...f, status: updatedStatus }
              : f
          )
        );
        Notifications.show({
          title: "Success",
          message: `Feature ${updatedStatus === "enabled" ? "enabled" : "disabled"} successfully.`,
          color: updatedStatus === "enabled" ? "green" : "red",
        });
      }
    } finally {
      setSwitchLoading(null);
    }
  };

  const saveCooldownTime = async () => {
    if (!editingFeature) return;
    setCooldownLoading(editingFeature.feature_name);

    try {
      const { error } = await supabase
        .from("features")
        .update({ cooldown_time: editingFeature.cooldown_time })
        .eq("feature_name", editingFeature.feature_name);

      if (error) {
        Notifications.show({
          title: "Error",
          message: "Failed to update cooldown time.",
          color: "red",
        });
      } else {
        setFeatures((prev) =>
          prev.map((f) =>
            f.feature_name === editingFeature.feature_name
              ? { ...f, cooldown_time: editingFeature.cooldown_time }
              : f
          )
        );
        Notifications.show({
          title: "Success",
          message: "Cooldown time updated successfully.",
          color: "green",
        });
        setEditingFeature(null);
      }
    } finally {
      setCooldownLoading(null);
    }
  };

  const removeAdmin = async (adminId: number) => {
    setAdminLoading(adminId);

    try {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", adminId);

      if (error) {
        Notifications.show({
          title: "Error",
          message: "Failed to remove admin.",
          color: "red",
        });
      } else {
        setAdmins((prev) => prev.filter((admin) => admin.id !== adminId));
        Notifications.show({
          title: "Success",
          message: "Admin removed successfully.",
          color: "green",
        });
      }
    } finally {
      setAdminLoading(null);
    }
  };

  const formatFeatureName = (featureName: string) => {
    return featureName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div>
      <h2>Feature Management</h2>
      <Table className="table-container">
        <thead>
          <tr>
            <th className="table-header column-feature-name">Feature Name</th>
            <th className="table-header column-status">Status</th>
            <th className="table-header column-cooldown">
              Cooldown Time (days)
            </th>
            <th className="table-header column-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.feature_name}>
              <td className="table-cell cell-feature-name">{formatFeatureName(feature.feature_name)}</td>
              <td className="table-cell cell-status">
                <div className="switch-container">
                  <Switch
                    checked={feature.status === "enabled"}
                    onChange={() => toggleFeatureStatus(feature)}
                    color={feature.status === "enabled" ? "#8685ef" : ""}
                    disabled={switchLoading === feature.feature_name}
                  />
                </div>
              </td>
              <td className="table-cell cell-cooldown">
                {editingFeature?.feature_name === feature.feature_name ? (
                  <TextInput
                    type="number"
                    value={editingFeature.cooldown_time}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        cooldown_time: parseInt(e.target.value, 10),
                      })
                    }
                  />
                ) : (
                  feature.cooldown_time
                )}
              </td>
              <td className="table-cell cell-actions">
                {editingFeature?.feature_name === feature.feature_name ? (
                  <Button.Group>
                    <Button
                      variant="default"
                      onClick={saveCooldownTime}
                      loading={cooldownLoading === editingFeature?.feature_name}>
                      Save
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setEditingFeature(null)}>
                      Cancel
                    </Button>
                  </Button.Group>
                ) : (
                  <Button
                    variant="default"
                    onClick={() =>
                      setEditingFeature({
                        feature_name: feature.feature_name,
                        status: feature.status,
                        cooldown_time: feature.cooldown_time,
                      })
                    }>
                    Edit Cooldown
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2 className="admin-actions-header">Manage Admins</h2>

      <Table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.email}</td>
              <td>{admin.username}</td>
              <td>{admin.role}</td>
              <td>
                <Button
                  color="red"
                  onClick={() => {
                    setAdminToRemove(admin);
                    setIsDialogOpen(true);
                  }}
                  loading={adminLoading === admin.id}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="pagination flex justify-center mt-4">
        <Pagination
          total={Math.ceil(totalAdmins / 10)}
          value={page}
          onChange={setPage}
          size="sm"
          radius="md"
          color="#8685ef"
          withControls
        />
      </div>

      <Modal
        opened={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Confirm Removal">
        <p>Are you sure you want to remove admin {adminToRemove?.username}?</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "1rem",
          }}>
          <Button variant="default" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              if (adminToRemove) await removeAdmin(adminToRemove.id);
              setIsDialogOpen(false);
            }}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminActions;