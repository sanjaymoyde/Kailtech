// Import Dependencies
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisHorizontalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useState } from "react";
import PropTypes from "prop-types";

// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Button } from "components/ui";

import axios from "utils/axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";

// ----------------------------------------------------------------------

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to delete this Bio medical safety test? Once deleted, it cannot be restored.",
  },
  success: {
    title: "Bio medical safety test Deleted",
  },
};

export function RowActions({ row, table }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    const id = row.original.id;
    // ✅ Fixed route to match router configuration
    navigate(`/dashboards/calibration-operations/bio-medical-safety-test/edit-visual-test-form/${id}`);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const closeModal = () => {
    setDeleteModalOpen(false);
  };

  const openModal = () => {
    setDeleteModalOpen(true);
    setDeleteError(false);
    setDeleteSuccess(false);
  };

  const handleDeleteRows = useCallback(async () => {
    const id = row.original.id;
    setConfirmDeleteLoading(true);

    try {
      const response = await axios.delete(
        `/calibrationoperations/delete-electricaltest/${id}`
      );

      if (response.data && response.data.status) {
        table.options.meta?.deleteRow(row); // remove row from UI
        setDeleteSuccess(true);
        toast.success("Electrical test deleted successfully");
      } else {
        setDeleteError(true);
        toast.error("Failed to delete electrical test");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError(true);

      let errorMessage = "Failed to delete electrical test";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setConfirmDeleteLoading(false);
    }
  }, [row, table]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  return (
    <>
      <div className="flex justify-center space-x-1.5">
        <Menu as="div" className="relative inline-block text-left">
          <MenuButton as={Button} isIcon className="size-8 rounded-full">
            <EllipsisHorizontalIcon className="size-4.5" />
          </MenuButton>
          <Transition
            as={Fragment}
            enter="transition ease-out"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <MenuItems
              anchor={{ to: "bottom end", gap: 12 }}
              className="absolute z-100 w-[10rem] rounded-lg border border-gray-300 bg-white py-1 shadow-lg shadow-gray-200/50 outline-hidden focus-visible:outline-hidden dark:border-dark-500 dark:bg-dark-750 dark:shadow-none ltr:right-0 rtl:left-0"
            >
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={handleEdit}
                    className={clsx(
                      "flex h-9 w-full items-center space-x-3 px-3 tracking-wide outline-hidden transition-colors ",
                      focus &&
                      "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100"
                    )}
                  >
                    <PencilIcon className="size-4.5 stroke-1" />
                    <span>Edit</span>
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={openModal}
                    className={clsx(
                      "this:error flex h-9 w-full items-center space-x-3 px-3 tracking-wide text-this outline-hidden transition-colors dark:text-this-light ",
                      focus && "bg-this/10 dark:bg-this-light/10"
                    )}
                  >
                    <TrashIcon className="size-4.5 stroke-1" />
                    <span>Delete</span>
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Transition>
        </Menu>
      </div>

      <ConfirmModal
        show={deleteModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleDeleteRows}
        confirmLoading={confirmDeleteLoading}
        state={state}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};