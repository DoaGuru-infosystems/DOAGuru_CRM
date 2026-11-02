import { useState, useEffect, useCallback, useMemo } from "react";

export function useColumnPreferences(tableKey, columns, user) {
  const role = user?.staff_role || user?.role || "default_role";
  const staffId =
    user?.staff_id ||
    user?.id ||
    user?.employeeId ||
    user?.admin_id ||
    "default_user";

  const storageKey = useMemo(
    () => `crm_table_cols:${tableKey}:${role}:${staffId}`,
    [tableKey, role, staffId]
  );

  const allKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const lockedKeys = useMemo(
    () => new Set(columns.filter((c) => c.locked).map((c) => c.key)),
    [columns]
  );

  const computeInitialVisible = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return allKeys;

      const parsed = JSON.parse(raw);
      let savedVisible = [];
      let knownKeys = [];

      if (Array.isArray(parsed)) {
        savedVisible = parsed;
        knownKeys = parsed;
      } else if (parsed && typeof parsed === "object") {
        savedVisible = parsed.visible || [];
        knownKeys = parsed.known || [];
      } else {
        return allKeys;
      }

      const currentKeySet = new Set(allKeys);
      // Ignore columns that no longer exist in current columns list
      const validVisible = new Set(
        savedVisible.filter((k) => currentKeySet.has(k))
      );

      // Add locked columns (always visible)
      lockedKeys.forEach((k) => validVisible.add(k));

      // Brand new columns not present in saved known list default to visible
      columns.forEach((col) => {
        if (!knownKeys.includes(col.key)) {
          validVisible.add(col.key);
        }
      });

      return allKeys.filter((k) => validVisible.has(k));
    } catch (err) {
      console.error("Error reading column preferences from localStorage:", err);
      return allKeys;
    }
  }, [allKeys, columns, lockedKeys, storageKey]);

  const [visibleColumns, setVisibleColumns] = useState(computeInitialVisible);

  useEffect(() => {
    setVisibleColumns(computeInitialVisible());
  }, [computeInitialVisible]);

  const saveToStorage = useCallback(
    (newVisibleKeys) => {
      try {
        const payload = {
          visible: newVisibleKeys,
          known: allKeys,
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (err) {
        console.error("Error saving column preferences to localStorage:", err);
      }
    },
    [allKeys, storageKey]
  );

  const toggleColumn = useCallback(
    (columnKey) => {
      // Locked columns cannot be toggled off
      if (lockedKeys.has(columnKey)) return;

      setVisibleColumns((prev) => {
        let updated;
        if (prev.includes(columnKey)) {
          updated = prev.filter((k) => k !== columnKey);
        } else {
          // Maintain column order defined in columns array
          updated = allKeys.filter((k) => prev.includes(k) || k === columnKey);
        }
        saveToStorage(updated);
        return updated;
      });
    },
    [allKeys, lockedKeys, saveToStorage]
  );

  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error("Error removing column preferences:", err);
    }
    setVisibleColumns(allKeys);
  }, [allKeys, storageKey]);

  const isColumnVisible = useCallback(
    (columnKey) => visibleColumns.includes(columnKey),
    [visibleColumns]
  );

  return {
    visibleColumns,
    toggleColumn,
    resetToDefault,
    isColumnVisible,
    storageKey,
  };
}

export default useColumnPreferences;

